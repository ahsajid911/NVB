import { NextRequest } from "next/server";
import { error as errorResponse } from "@/lib/utils/apiResponse";
import { logger } from "@/lib/utils/logger";

/**
 * Application-level error with HTTP status and optional code.
 * Throw this from services/repos to produce a clean HTTP response.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

type Handler = (req: NextRequest, ctx?: any) => Promise<Response>;

/**
 * Wraps a route handler with uniform error handling.
 * Catches AppError (produces its status/code) and unexpected errors (500 + log).
 */
export function withErrorHandler(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err: any) {
      if (err instanceof AppError) {
        if (err.statusCode >= 500) {
          logger.error(err.message, { stack: err.stack, path: req.nextUrl?.pathname });
        }
        return errorResponse(err.message, err.statusCode, err.code);
      }

      // Unexpected error — log full detail, return generic message
      logger.error("Unhandled error", {
        error: err.message,
        stack: err.stack,
        path: req.nextUrl?.pathname,
        method: req.method,
      });
      return errorResponse("Internal server error", 500, "INTERNAL_ERROR");
    }
  };
}
