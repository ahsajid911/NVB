import { NextResponse } from "next/server";

/**
 * Consistent API response envelope.
 * Success:  { data: T }
 * Error:    { error: { message, code? } }
 */

export function success<T>(data: T, status: number = 200, headers?: Record<string, string>): NextResponse {
  return NextResponse.json({ data }, { status, headers });
}

export function error(
  message: string,
  status: number = 400,
  code?: string,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json({ error: { message, code } }, { status, headers });
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
    { headers }
  );
}
