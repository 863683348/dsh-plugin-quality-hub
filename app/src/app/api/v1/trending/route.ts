// GET /api/v1/trending - recently active + most starred
// docs/api/api-spec.md §2.5

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { getCachedTrending, parsePagination } from "@/services/plugin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await rateLimit(`trending:${ip}`);

    const searchParams = req.nextUrl.searchParams;
    const { limit } = parsePagination(null, searchParams.get("limit"), 50);

    const data = await getCachedTrending(limit);
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}
