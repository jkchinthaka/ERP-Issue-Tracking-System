import { NextRequest } from "next/server";
import { ApiError } from "./auth";

const windowMs = 15 * 60 * 1000;
const maxAttempts = 8;

type LoginAttempt = {
  count: number;
  firstAttemptAt: number;
};

declare global {
  var nelnaLoginAttempts: Map<string, LoginAttempt> | undefined;
}

const attempts = global.nelnaLoginAttempts ?? new Map<string, LoginAttempt>();

if (!global.nelnaLoginAttempts) {
  global.nelnaLoginAttempts = attempts;
}

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function cleanup(now: number) {
  for (const [key, value] of attempts.entries()) {
    if (now - value.firstAttemptAt > windowMs) {
      attempts.delete(key);
    }
  }
}

export function loginRateLimitKey(request: NextRequest, email: string) {
  return `${clientIp(request)}:${email.toLowerCase()}`;
}

export function assertLoginAllowed(key: string) {
  const now = Date.now();
  cleanup(now);
  const attempt = attempts.get(key);
  if (attempt && attempt.count >= maxAttempts && now - attempt.firstAttemptAt <= windowMs) {
    throw new ApiError("Too many failed login attempts. Please wait a few minutes and try again.", 429);
  }
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.firstAttemptAt > windowMs) {
    attempts.set(key, { count: 1, firstAttemptAt: now });
    return;
  }

  attempts.set(key, { ...current, count: current.count + 1 });
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
