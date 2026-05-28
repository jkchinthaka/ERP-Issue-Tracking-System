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
const supportedDrivers = new Set(["local", "cloudinary", "s3", "google-drive", "company-file-server"]);
let warnedAboutLocalProductionStorage = false;

export type FileStorageDriver = "local" | "cloudinary" | "s3" | "google-drive" | "company-file-server";

export type StoredFile = {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  storageDriver: FileStorageDriver;
};

export function getFileStorageDriver(): FileStorageDriver {
  const configured = (process.env.FILE_STORAGE_DRIVER || "local").trim().toLowerCase();
  return supportedDrivers.has(configured) ? (configured as FileStorageDriver) : "local";
}

export function warnIfLocalProductionStorage() {
  if (process.env.NODE_ENV === "production" && getFileStorageDriver() === "local" && !warnedAboutLocalProductionStorage) {
    warnedAboutLocalProductionStorage = true;
    console.warn("[storage] FILE_STORAGE_DRIVER=local stores uploads inside the app container. Use external storage for production persistence.");
  }
}

function validateIssueAttachment(file: File) {
  if (file.size > maxFileSize) {
    throw new Error("Attachment upload failed. File size must be 5 MB or less.");
  }

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    throw new Error("Attachment upload failed. Allowed files: jpg, png, pdf, docx, xlsx.");
  }

  return extension;
}

function safeFileName(file: File, issueId: string, extension: string) {
  const safeBaseName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return `${issueId}-${safeBaseName || "attachment"}-${randomUUID()}.${extension}`;
}

async function saveLocalIssueAttachment(file: File, issueId: string): Promise<StoredFile> {
  const extension = validateIssueAttachment(file);
  const fileName = safeFileName(file, issueId, extension);
  const uploadDir = path.join(process.cwd(), "public", "uploads", "issues");
  await mkdir(uploadDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), bytes);

  return {
    fileName: file.name,
    fileUrl: `/uploads/issues/${fileName}`,
    fileType: file.type,
    fileSize: file.size,
    storageDriver: "local",
  };
}

async function saveExternalIssueAttachment(file: File, issueId: string, driver: Exclude<FileStorageDriver, "local">): Promise<StoredFile> {
  validateIssueAttachment(file);
  void issueId;
  throw new Error(`${driver} upload storage is not configured yet. Your issue can still be submitted without the attachment.`);
}

export async function saveIssueAttachment(file: File, issueId: string): Promise<StoredFile> {
  const driver = getFileStorageDriver();
  warnIfLocalProductionStorage();

  if (driver === "local") {
    return saveLocalIssueAttachment(file, issueId);
  }

  return saveExternalIssueAttachment(file, issueId, driver);
}
