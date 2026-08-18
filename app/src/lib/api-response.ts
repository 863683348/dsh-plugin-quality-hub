// Unified API response helpers (ADR-008)
// Envelope: { code, data, message }

import { NextResponse } from "next/server";
import { ApiError, ErrorCodes } from "@/lib/errors";
import type { ApiEnvelope } from "@/types/api";

export function ok<T>(data: T, message = ""): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ code: ErrorCodes.OK, data, message });
}

export function fail(error: unknown): NextResponse<ApiEnvelope<null>> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { code: error.code, data: (error.data ?? null) as unknown as null, message: error.message },
      { status: error.httpStatus }
    );
  }
  // Unexpected error: log server-side, do not leak details
  console.error("[api] unhandled error:", error);
  return NextResponse.json(
    { code: ErrorCodes.INTERNAL, data: null, message: "Internal server error" },
    { status: 500 }
  );
}

export { ErrorCodes };
