import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    return ok({ user });
  } catch (error) {
    return fail(error);
  }
}
