import "dotenv/config";
import { runBackupSync } from "./backup-sync-lib";

runBackupSync({ mode: "full" })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
