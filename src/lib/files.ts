import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["application/pdf", "pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
]);

const maxFileSize = 5 * 1024 * 1024;

export async function saveIssueAttachment(file: File, issueId: string) {
  if (file.size > maxFileSize) {
    throw new Error("Attachment upload failed. File size must be 5 MB or less.");
  }

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    throw new Error("Attachment upload failed. Allowed files: jpg, png, pdf, docx, xlsx.");
  }

  const safeBaseName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const fileName = `${issueId}-${safeBaseName || "attachment"}-${randomUUID()}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "issues");
  await mkdir(uploadDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), bytes);

  return {
    fileName: file.name,
    fileUrl: `/uploads/issues/${fileName}`,
    fileType: file.type,
    fileSize: file.size,
  };
}
