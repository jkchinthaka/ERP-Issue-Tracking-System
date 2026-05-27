import mongoose, { type Connection } from "mongoose";
import type { Db, Document } from "mongodb";

export const MAIN_DATABASE_NAME = "nelna";
export const BACKUP_DATABASE_NAME = "bileeta_db";
export const BACKUP_SYNC_NAME = "atlas-to-local-backup";

export const BACKUP_SYNC_COLLECTIONS = [
  "users",
  "roles",
  "departments",
  "erpModules",
  "issues",
  "issueComments",
  "attachments",
  "vendors",
  "vendorFollowups",
  "emailLogs",
  "auditLogs",
  "knowledgeBase",
  "improvementActions",
  "slaRules",
  "settings",
  "notifications",
  "backupSyncLogs",
] as const;

export type BackupSyncMode = "full" | "incremental";

export type CollectionSyncSummary = {
  collectionName: string;
  documentsFound: number;
  documentsSynced: number;
  failedCount: number;
  startedAt: Date;
  finishedAt: Date;
};

type DatabaseConnection = {
  connection: Connection;
  db: Db;
};

export type SyncStateDocument = {
  _id: string;
  syncName?: string;
  lastSyncAt?: Date | null;
  status?: string;
  lastError?: string | null;
  updatedAt?: Date;
  collectionsSynced?: string[];
  lastSummary?: CollectionSyncSummary[];
  [key: string]: unknown;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required before running backup sync.`);
  }
  return value;
}

export function assertPullMode() {
  const syncMode = process.env.BACKUP_SYNC_MODE ?? "pull";
  if (syncMode !== "pull") {
    throw new Error("Only BACKUP_SYNC_MODE=pull is supported. The worker never writes backup data back to Atlas.");
  }
}

export function getBackupSyncIntervalMinutes() {
  const interval = Number(process.env.BACKUP_SYNC_INTERVAL_MINUTES ?? "5");
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error("BACKUP_SYNC_INTERVAL_MINUTES must be a positive number.");
  }
  return interval;
}

export async function openDatabaseConnection(uri: string, dbName: string, label: string, timeoutMs = 30000): Promise<DatabaseConnection> {
  const connection = await mongoose.createConnection(uri, {
    dbName,
    autoIndex: false,
    serverSelectionTimeoutMS: timeoutMs,
  }).asPromise();

  if (!connection.db) {
    await connection.close();
    throw new Error(`${label} connection did not expose a database handle.`);
  }

  return { connection, db: connection.db };
}

export async function openMainDatabase(timeoutMs?: number) {
  return openDatabaseConnection(requireEnv("MAIN_DATABASE_URL"), MAIN_DATABASE_NAME, "Atlas main database", timeoutMs);
}

export async function openBackupDatabase(timeoutMs?: number) {
  return openDatabaseConnection(requireEnv("BACKUP_DATABASE_URL"), BACKUP_DATABASE_NAME, "local backup database", timeoutMs);
}

export async function closeDatabaseConnections(...connections: Array<DatabaseConnection | null>) {
  await Promise.all(connections.filter(Boolean).map((databaseConnection) => databaseConnection?.connection.close()));
}

function stringifyDocumentId(documentId: unknown) {
  if (documentId === null || documentId === undefined) return "";
  return String(documentId);
}

export function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function writeBackupSyncLog(input: {
  backupDb: Db;
  collectionName: string;
  documentId?: unknown;
  operationType: string;
  status: "success" | "failed" | "skipped";
  errorMessage?: string;
  retryCount?: number;
  startedAt: Date;
  finishedAt: Date;
}) {
  const now = new Date();
  await input.backupDb.collection("backupSyncLogs").insertOne({
    collectionName: input.collectionName,
    documentId: stringifyDocumentId(input.documentId),
    operationType: input.operationType,
    status: input.status,
    errorMessage: input.errorMessage ?? "",
    retryCount: input.retryCount ?? 0,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    createdAt: now,
    updatedAt: now,
  });
}

async function getLastSyncAt(backupDb: Db) {
  const syncState = await backupDb.collection<SyncStateDocument>("syncState").findOne({ _id: BACKUP_SYNC_NAME });
  return syncState?.lastSyncAt instanceof Date ? syncState.lastSyncAt : null;
}

async function collectionHasUpdatedAt(mainDb: Db, collectionName: string) {
  const documentWithUpdatedAt = await mainDb.collection(collectionName).findOne({ updatedAt: { $exists: true } }, { projection: { _id: 1 } });
  return Boolean(documentWithUpdatedAt);
}

async function markSyncStateRunning(backupDb: Db) {
  await backupDb.collection<SyncStateDocument>("syncState").updateOne(
    { _id: BACKUP_SYNC_NAME },
    {
      $set: {
        syncName: BACKUP_SYNC_NAME,
        status: "running",
        lastError: null,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        lastSyncAt: null,
      },
    },
    { upsert: true },
  );
}

async function markSyncStateFinished(input: {
  backupDb: Db;
  status: "success" | "failed";
  lastSyncAt: Date | null;
  lastError: string | null;
  summaries: CollectionSyncSummary[];
}) {
  const successfulCollections = input.summaries.filter((summary) => summary.failedCount === 0).map((summary) => summary.collectionName);

  await input.backupDb.collection<SyncStateDocument>("syncState").updateOne(
    { _id: BACKUP_SYNC_NAME },
    {
      $set: {
        syncName: BACKUP_SYNC_NAME,
        lastSyncAt: input.lastSyncAt,
        status: input.status,
        lastError: input.lastError,
        collectionsSynced: successfulCollections,
        lastSummary: input.summaries,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

async function syncCollection(input: {
  mainDb: Db;
  backupDb: Db;
  collectionName: string;
  mode: BackupSyncMode;
  lastSyncAt: Date | null;
}) {
  const startedAt = new Date();
  const hasUpdatedAt = input.mode === "incremental" && input.lastSyncAt ? await collectionHasUpdatedAt(input.mainDb, input.collectionName) : false;
  const filter = hasUpdatedAt && input.lastSyncAt ? { updatedAt: { $gt: input.lastSyncAt } } : {};
  const sourceCollection = input.mainDb.collection<Document>(input.collectionName);
  const backupCollection = input.backupDb.collection<Document>(input.collectionName);
  const documentsFound = await sourceCollection.countDocuments(filter);
  let documentsSynced = 0;
  let failedCount = 0;

  const cursor = sourceCollection.find(filter);

  for await (const sourceDocument of cursor) {
    const documentStartedAt = new Date();

    try {
      if (sourceDocument._id === undefined || sourceDocument._id === null) {
        failedCount += 1;
        await writeBackupSyncLog({
          backupDb: input.backupDb,
          collectionName: input.collectionName,
          operationType: "pull-upsert",
          status: "skipped",
          errorMessage: "Source document has no _id and cannot be mirrored safely.",
          startedAt: documentStartedAt,
          finishedAt: new Date(),
        });
        continue;
      }

      await backupCollection.replaceOne({ _id: sourceDocument._id }, sourceDocument, { upsert: true });
      documentsSynced += 1;
    } catch (error) {
      failedCount += 1;
      await writeBackupSyncLog({
        backupDb: input.backupDb,
        collectionName: input.collectionName,
        documentId: sourceDocument._id,
        operationType: "pull-upsert",
        status: "failed",
        errorMessage: formatError(error),
        startedAt: documentStartedAt,
        finishedAt: new Date(),
      });
    }
  }

  return {
    collectionName: input.collectionName,
    documentsFound,
    documentsSynced,
    failedCount,
    startedAt,
    finishedAt: new Date(),
  } satisfies CollectionSyncSummary;
}

function printSyncSummary(mode: BackupSyncMode, summaries: CollectionSyncSummary[]) {
  console.log(`MongoDB backup ${mode} sync summary`);
  console.table(
    summaries.map((summary) => ({
      collectionName: summary.collectionName,
      documentsFound: summary.documentsFound,
      documentsSynced: summary.documentsSynced,
      failedCount: summary.failedCount,
      startedAt: summary.startedAt.toISOString(),
      finishedAt: summary.finishedAt.toISOString(),
    })),
  );
}

export async function runBackupSync(options: { mode: BackupSyncMode }) {
  assertPullMode();

  let mainConnection: DatabaseConnection | null = null;
  let backupConnection: DatabaseConnection | null = null;
  const syncStartedAt = new Date();

  try {
    mainConnection = await openMainDatabase();
    backupConnection = await openBackupDatabase();

    await markSyncStateRunning(backupConnection.db);

    const previousLastSyncAt = await getLastSyncAt(backupConnection.db);
    const effectiveMode = options.mode === "incremental" && !previousLastSyncAt ? "full" : options.mode;
    const lastSyncAt = effectiveMode === "incremental" ? previousLastSyncAt : null;
    const summaries: CollectionSyncSummary[] = [];

    if (options.mode === "incremental" && effectiveMode === "full") {
      console.log("No previous successful sync found. Running the first backup sync as a full sync.");
    }

    for (const collectionName of BACKUP_SYNC_COLLECTIONS) {
      try {
        summaries.push(await syncCollection({
          mainDb: mainConnection.db,
          backupDb: backupConnection.db,
          collectionName,
          mode: effectiveMode,
          lastSyncAt,
        }));
      } catch (error) {
        const failedAt = new Date();
        summaries.push({
          collectionName,
          documentsFound: 0,
          documentsSynced: 0,
          failedCount: 1,
          startedAt: failedAt,
          finishedAt: failedAt,
        });
        await writeBackupSyncLog({
          backupDb: backupConnection.db,
          collectionName,
          operationType: "pull-collection",
          status: "failed",
          errorMessage: formatError(error),
          startedAt: failedAt,
          finishedAt: failedAt,
        });
      }
    }

    const totalFailed = summaries.reduce((total, summary) => total + summary.failedCount, 0);
    const nextLastSyncAt = totalFailed === 0 ? syncStartedAt : previousLastSyncAt;
    await markSyncStateFinished({
      backupDb: backupConnection.db,
      status: totalFailed === 0 ? "success" : "failed",
      lastSyncAt: nextLastSyncAt,
      lastError: totalFailed === 0 ? null : `${totalFailed} document or collection sync failures occurred. Check backupSyncLogs.`,
      summaries,
    });

    printSyncSummary(effectiveMode, summaries);

    if (totalFailed > 0) {
      throw new Error(`${totalFailed} backup sync failures occurred. Check backupSyncLogs in the local backup database.`);
    }
  } finally {
    await closeDatabaseConnections(mainConnection, backupConnection);
  }
}
