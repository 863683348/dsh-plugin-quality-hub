// GET /api/v1/plugins - plugin list with pagination + search + grade filter + sort
// docs/api/api-spec.md §2.1

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import {
  getCachedPluginList,
  parseSortField,
  parseSortOrder,
  parsePagination,
  parseGrade,
} from "@/services/plugin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Rate limit: 60 req/min per IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await rateLimit(`plugins:${ip}`);

    const searchParams = req.nextUrl.searchParams;
    const { page, limit } = parsePagination(
      searchParams.get("page"),
      searchParams.get("limit"),
      100
    );
    const q = searchParams.get("q") ?? undefined;
    if (q && (q.length < 1 || q.length > 100)) {
      throw ApiError.badParam(
        "Invalid parameter: q must be between 1 and 100 characters",
        "q"
      );
    }
    const grade = parseGrade(searchParams.get("grade"));
    const sort = parseSortField(searchParams.get("sort"));
    const order = parseSortOrder(searchParams.get("order"));

    const data = await getCachedPluginList({ page, limit, q, grade, sort, order });
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}
