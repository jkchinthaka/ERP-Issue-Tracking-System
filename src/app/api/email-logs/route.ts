import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { EmailLog } from "@/lib/models";
import { serialize } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, "view_audit_log");
    await connectToDatabase();
    const logs = await EmailLog.find({}).sort({ sentAt: -1 }).limit(200).lean();
    return ok({ logs: serialize(logs) });
  } catch (error) {
    return fail(error);
  }
}
