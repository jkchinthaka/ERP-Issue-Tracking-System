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
}