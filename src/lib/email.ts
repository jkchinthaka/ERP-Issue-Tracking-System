import nodemailer from "nodemailer";
import { DEFAULT_IT_RECIPIENTS } from "./constants";
import { EmailLog } from "./models";
import { toId } from "./utils";

type IssueEmailInput = {
  issue: Record<string, unknown>;
  departmentName: string;
  moduleName: string;
  reportedByName: string;
  reportedByEmail: string;
  extraTo?: string[];
};

function getConfiguredItEmails() {
  const configured = process.env.DEFAULT_IT_EMAILS?.split(",").map((email) => email.trim()).filter(Boolean);
  return configured?.length ? configured : DEFAULT_IT_RECIPIENTS.map((person) => person.email);
}

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function senderAddress() {
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || "Nelna ERP Support <erp-support@nelna.local>";
}

function issueLink(issueId: string) {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  return appUrl ? `${appUrl}/?issue=${encodeURIComponent(issueId)}` : "Login to the Nelna ERP Support & Improvement System to view this issue.";
}

export function buildIssueEmail(input: IssueEmailInput) {
  const { issue, departmentName, moduleName, reportedByName, reportedByEmail } = input;
  const issueId = String(issue.issueId);
  const subject = `[ERP Issue] ${String(issue.priority)} - ${departmentName} - ${String(issue.title)} - ${issueId}`;
  const body = [
    `Issue ID: ${issueId}`,
    `Reported By: ${reportedByName} (${reportedByEmail})`,
    `Department: ${departmentName}`,
    `ERP Module: ${moduleName}`,
    `Request Type: ${String(issue.requestType)}`,
    `Priority: ${String(issue.priority)}`,
    `Business Impact: ${String(issue.businessImpact)}`,
    `Current Status: ${String(issue.status)}`,
    `Reporter: ${reportedByName}`,
    `Created Date and Time: ${new Date(String(issue.createdAt ?? Date.now())).toLocaleString()}`,
    `Issue Link: ${issueLink(issueId)}`,
    `Description: ${String(issue.description)}`,
    `Attachment link: ${String(issue.attachmentLink ?? "Not attached")}`,
    "Required Action: Please review, acknowledge, and assign ownership in the Nelna ERP Support & Improvement System.",
  ].join("\n");

  return { subject, body };
}

export async function sendIssueEmail(input: IssueEmailInput) {
  const to = Array.from(new Set([...getConfiguredItEmails(), ...(input.extraTo ?? [])]));
  const { subject, body } = buildIssueEmail(input);

  if (!hasSmtpConfig()) {
    await EmailLog.create({
      issueId: toId(input.issue._id),
      to,
      cc: [],
      subject,
      body,
      status: "Failed",
      errorMessage: "SMTP is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env.",
      sentAt: new Date(),
    });
    return { ok: false, message: "SMTP is not configured." };
  }

  try {
    await createTransporter().sendMail({
      from: senderAddress(),
      to,
      subject,
      text: body,
    });

    await EmailLog.create({
      issueId: toId(input.issue._id),
      to,
      cc: [],
      subject,
      body,
      status: "Sent",
      sentAt: new Date(),
    });

    return { ok: true, message: "Email sent." };
  } catch (error) {
    await EmailLog.create({
      issueId: toId(input.issue._id),
      to,
      cc: [],
      subject,
      body,
      status: "Failed",
      errorMessage: error instanceof Error ? error.message : "Email sending failed.",
      sentAt: new Date(),
    });
    return { ok: false, message: "Email notification failed." };
  }
}

export async function sendLoggedEmail(input: {
  issueId?: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
}) {
  if (!hasSmtpConfig()) {
    await EmailLog.create({
      issueId: input.issueId,
      to: input.to,
      cc: input.cc ?? [],
      subject: input.subject,
      body: input.body,
      status: "Failed",
      errorMessage: "SMTP is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env.",
      sentAt: new Date(),
    });
    return { ok: false, message: "SMTP is not configured." };
  }

  try {
    await createTransporter().sendMail({
      from: senderAddress(),
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      text: input.body,
    });
    await EmailLog.create({
      issueId: input.issueId,
      to: input.to,
      cc: input.cc ?? [],
      subject: input.subject,
      body: input.body,
      status: "Sent",
      sentAt: new Date(),
    });
    return { ok: true, message: "Email sent." };
  } catch (error) {
    await EmailLog.create({
      issueId: input.issueId,
      to: input.to,
      cc: input.cc ?? [],
      subject: input.subject,
      body: input.body,
      status: "Failed",
      errorMessage: error instanceof Error ? error.message : "Email sending failed.",
      sentAt: new Date(),
    });
    return { ok: false, message: "Email notification failed." };
  }
}

