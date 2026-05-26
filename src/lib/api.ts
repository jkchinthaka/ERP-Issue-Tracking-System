import { NextResponse } from "next/server";
import { ApiError } from "./auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
}

export function parseSearch(request: Request) {
  return new URL(request.url).searchParams;
}
