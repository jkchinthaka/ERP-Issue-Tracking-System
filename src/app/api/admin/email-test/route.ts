import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { sendLoggedEmail } from "@/lib/email";
import { emailField, requiredText, validateInput, z } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailTestSchema = z.object({
  to: emailField("Recipient email"),
  subject: requiredText("Subject", 160).default("Nelna ERP Support SMTP test"),
  body: requiredText("Message", 1000).default("This is a test email from the Nelna ERP Support & Improvement System."),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, "manage_settings");
    const input = validateInput(emailTestSchema, await request.json());
    const result = await sendLoggedEmail({
      to: [input.to],
      subject: input.subject,
      body: input.body,
    });

    await createAuditLog({
      entityType: "Settings",
      entityId: "smtp",
      action: "SMTP test email sent",
      performedBy: user.id,
      request,
      newValue: { to: input.to, status: result.ok ? "Sent" : "Failed" },
    });

    return ok({ result });
  } catch (error) {
    return fail(error);
  }
}
