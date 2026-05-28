import { z } from "zod";
import { ApiError } from "./auth";
import { isObjectId, sanitizeText } from "./utils";

export { z };

export function cleanText(maxLength = 3000) {
  return z.preprocess((value) => sanitizeText(value, maxLength), z.string());
}

export function optionalText(maxLength = 3000) {
  return z.preprocess((value) => {
    if (value === undefined || value === null) return undefined;
    return sanitizeText(value, maxLength);
  }, z.string().optional());
}

export function requiredText(label: string, maxLength = 3000) {
  return cleanText(maxLength).refine((value) => value.length > 0, { message: `${label} is required.` });
}

export function emailField(label = "Email") {
  return requiredText(label, 180)
    .transform((value) => value.toLowerCase())
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), { message: "Enter a valid email address." });
}

export function passwordField(label = "Password") {
  return z.preprocess((value) => (typeof value === "string" ? value : ""), z.string().min(1, `${label} is required.`).max(256, `${label} is too long.`));
}

export function objectIdField(label: string) {
  return requiredText(label, 80).refine((value) => isObjectId(value), { message: `Invalid ${label.toLowerCase()} selected.` });
}

export function optionalObjectIdField(label: string) {
  return cleanText(80)
    .refine((value) => !value || isObjectId(value), { message: `Invalid ${label.toLowerCase()} selected.` })
    .transform((value) => value || undefined);
}

export function optionalDateField(label: string) {
  return cleanText(80)
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), { message: `Invalid ${label.toLowerCase()} selected.` })
    .transform((value) => (value ? new Date(value) : undefined));
}

export function optionalBooleanField() {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }, z.boolean().optional());
}

export function optionalNumberField(label: string) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    return Number(value);
  }, z.number({ error: `${label} must be a number.` }).finite(`${label} must be a valid number.`).optional());
}

export function validateInput<Schema extends z.ZodType>(schema: Schema, input: unknown): z.infer<Schema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ApiError(result.error.issues[0]?.message ?? "Invalid request payload.", 400);
  }
  return result.data;
}
