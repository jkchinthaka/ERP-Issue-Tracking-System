import mongoose from "mongoose";

export function sanitizeText(value: unknown, maxLength = 3000) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function isObjectId(value: unknown) {
  return typeof value === "string" && mongoose.Types.ObjectId.isValid(value);
}

export function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

export function toId(value: unknown) {
  if (!value) {
    return "";
  }

  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }

  return String(value);
}

export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

export function minutesBetween(start?: Date | string | null, end?: Date | string | null) {
  if (!start || !end) {
    return null;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
}

export function formatIssueCounter(sequence: number) {
  return String(sequence).padStart(4, "0");
}

export function compact<T>(values: Array<T | null | undefined | false>) {
  return values.filter(Boolean) as T[];
}
