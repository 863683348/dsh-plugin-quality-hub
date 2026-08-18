// GET /api/v1/security - security flags list, filterable by type
// docs/api/api-spec.md §2.4

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import {
  getCachedSecurity,
  parseSecurityType,
  parsePagination,
} from "@/services/plugin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await rateLimit(`security:${ip}`);

    const searchParams = req.nextUrl.searchParams;
    const type = parseSecurityType(searchParams.get("type"));
    const { limit } = parsePagination(null, searchParams.get("limit"), 100);

    const data = await getCachedSecurity(type, limit);
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}
