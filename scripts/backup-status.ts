import "dotenv/config";
import {
  BACKUP_SYNC_NAME,
  closeDatabaseConnections,
  formatError,
  openBackupDatabase,
  openMainDatabase,
  type CollectionSyncSummary,
  type SyncStateDocument,
} from "./backup-sync-lib";

async function main() {
  const statusRows: Array<{ name: string; status: string; detail: string }> = [];
  let mainConnection: Awaited<ReturnType<typeof openMainDatabase>> | null = null;
  let backupConnection: Awaited<ReturnType<typeof openBackupDatabase>> | null = null;

  try {
    try {
      mainConnection = await openMainDatabase(10000);
      statusRows.push({ name: "Atlas DB", status: "connected", detail: "MAIN_DATABASE_URL / nelna" });
    } catch (error) {
      statusRows.push({ name: "Atlas DB", status: "failed", detail: formatError(error) });
    }

    try {
      backupConnection = await openBackupDatabase(10000);
      statusRows.push({ name: "Local backup DB", status: "connected", detail: "BACKUP_DATABASE_URL / bileeta_db" });
    } catch (error) {
      statusRows.push({ name: "Local backup DB", status: "failed", detail: formatError(error) });
    }

    console.log("Backup database connection status");
    console.table(statusRows);

    if (!backupConnection) {
      console.log("Backup sync status is unavailable because the local backup database is not connected.");
      return;
    }

    const syncState = await backupConnection.db.collection<SyncStateDocument>("syncState").findOne({ _id: BACKUP_SYNC_NAME });
    const failedDocumentCount = await backupConnection.db.collection("backupSyncLogs").countDocuments({ status: "failed" });
    const lastSummary = (syncState?.lastSummary ?? []) as CollectionSyncSummary[];
    const lastRunFailedCount = lastSummary.reduce((total, summary) => total + (summary.failedCount ?? 0), 0);

    console.log("Backup sync status");
    console.table([
      {
        syncName: syncState?.syncName ?? BACKUP_SYNC_NAME,
        lastSyncAt: syncState?.lastSyncAt ? new Date(syncState.lastSyncAt).toISOString() : "never",
        status: syncState?.status ?? "not-run",
        collectionsSynced: Array.isArray(syncState?.collectionsSynced) ? syncState.collectionsSynced.length : 0,
        lastRunFailedCount,
        failedDocumentCount,
        lastError: syncState?.lastError ?? "",
      },
    ]);

    if (lastSummary.length > 0) {
      console.log("Last collection summary");
      console.table(
        lastSummary.map((summary) => ({
          collectionName: summary.collectionName,
          documentsFound: summary.documentsFound,
          documentsSynced: summary.documentsSynced,
          failedCount: summary.failedCount,
        })),
      );
    }
  } finally {
    await closeDatabaseConnections(mainConnection, backupConnection);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
