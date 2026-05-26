import { NextRequest } from "next/server";
import { AuditLog } from "./models";

type AuditInput = {
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  performedBy?: string;
  request?: NextRequest;
};

export async function createAuditLog(input: AuditInput) {
  const now = new Date();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  await AuditLog.create({
    logId: `AUD-${now.getFullYear()}-${now.getTime()}-${random}`,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    oldValue: input.oldValue,
    newValue: input.newValue,
    performedBy: input.performedBy,
    performedAt: now,
    ipAddress: input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    userAgent: input.request?.headers.get("user-agent") ?? "",
  });
}
