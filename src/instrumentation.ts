const startupLogKey = "__NELNA_STARTUP_LOGGED__";

function envStatus(value: string | undefined) {
  return value && value.trim().length > 0 ? "present" : "missing";
}

export function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const globalState = globalThis as typeof globalThis & {
    __NELNA_STARTUP_LOGGED__?: boolean;
  };

  if (globalState[startupLogKey]) {
    return;
  }

  globalState[startupLogKey] = true;

  console.log("[startup] ERP Issue Tracking System starting");
  console.log(
    `[startup] nodeEnv=${process.env.NODE_ENV || "missing"} port=${process.env.PORT || "3000"} hostname=${process.env.HOSTNAME || "0.0.0.0"}`,
  );
  console.log(
    `[startup] env MAIN_DATABASE_URL=${envStatus(process.env.MAIN_DATABASE_URL)} JWT_SECRET=${envStatus(process.env.JWT_SECRET)} APP_URL=${envStatus(process.env.APP_URL)}`,
  );

  if (!process.env.JWT_SECRET) {
    console.error("[startup] JWT_SECRET is missing. Login sessions cannot be signed until it is configured.");
  }

  if (process.env.NODE_ENV === "production" && process.env.BACKUP_DATABASE_URL) {
    console.warn("[startup] BACKUP_DATABASE_URL is set on the hosted app. Remove it from Render; it belongs only on the company backup worker.");
  }

  if (process.env.NODE_ENV === "production" && (process.env.FILE_STORAGE_DRIVER || "local") === "local") {
    console.warn("[startup] FILE_STORAGE_DRIVER=local is not persistent on Render redeploys. Use external storage for production uploads.");
  }
}