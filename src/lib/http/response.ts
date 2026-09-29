/**
 * What this file does: Maps thrown domain/validation errors into consistent HTTP JSON responses.
 * What calls it: Auth middleware and any route-level error handling via `withAuth`.
 * What it calls: NextResponse + AppError/ZodError types.
 * Junior pitfall: Returning raw thrown errors and leaking stack traces or inconsistent status codes.
 */
import { NextResponse } from "next/server";
import { AppError } from "@/lib/http/errors";
import { ZodError } from "zod";

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message
        }
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    // ⚠️ SENIOR NOTE: flattening validation errors keeps response shape stable for UI form-level handling.
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          details: error.flatten()
        }
      },
      { status: 422 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error"
      }
    },
    { status: 500 }
  );
}
