/**
 * Parse and sanitize pagination params from a URL search params object.
 */
export function parsePagination(params: URLSearchParams): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") || "20", 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/** Parse a comma-separated list param. */
export function parseList(params: URLSearchParams, key: string): string[] {
  const val = params.get(key);
  if (!val) return [];
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}
