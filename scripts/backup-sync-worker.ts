import "dotenv/config";
import { formatError, getBackupSyncIntervalMinutes, runBackupSync } from "./backup-sync-lib";

let shouldStop = false;

process.on("SIGINT", () => {
  shouldStop = true;
});

process.on("SIGTERM", () => {
  shouldStop = true;
});

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runLoop() {
  const watchMode = process.argv.includes("--watch");

  if (!watchMode) {
    await runBackupSync({ mode: "incremental" });
    return;
  }

  const intervalMinutes = getBackupSyncIntervalMinutes();
  console.log(`Starting backup sync worker. Pulling Atlas to local backup every ${intervalMinutes} minutes.`);

  while (!shouldStop) {
    try {
      await runBackupSync({ mode: "incremental" });
    } catch (error) {
      console.error(`Backup sync failed: ${formatError(error)}`);
    }

    if (!shouldStop) {
      await wait(intervalMinutes * 60000);
    }
  }
}

runLoop()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
