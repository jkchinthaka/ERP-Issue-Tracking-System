import { ok } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "disconnected" = "disconnected";

  try {
    const connection = await connectToDatabase();
    database = connection.connection.readyState === 1 ? "connected" : "disconnected";
  } catch (error) {
    console.warn("[health] database check failed", error instanceof Error ? error.message : String(error));
  }

  return ok({
    status: "ok",
    app: "Nelna ERP Support",
    timestamp: new Date().toISOString(),
    database,
    environment: process.env.NODE_ENV === "production" ? "production" : "development",
  });
}
