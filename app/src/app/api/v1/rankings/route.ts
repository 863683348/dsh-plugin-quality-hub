// GET /api/v1/rankings - Top Rated leaderboard
// docs/api/api-spec.md §2.3

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import {
  getCachedPluginList,
  getRankings,
  parseRankingSort,
  parsePagination,
} from "@/services/plugin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await rateLimit(`rankings:${ip}`);

    const searchParams = req.nextUrl.searchParams;
    const sort = parseRankingSort(searchParams.get("sort"));
    const { limit } = parsePagination(null, searchParams.get("limit"), 100);

    let items;
    if (sort === "score") {
      const list = await getCachedPluginList({
        page: 1,
        limit,
        sort: "score",
        order: "desc",
      });
      items = list.items;
    } else if (sort === "stars") {
      const list = await getCachedPluginList({
        page: 1,
        limit,
        sort: "stars",
        order: "desc",
      });
      items = list.items;
    } else {
      const rankings = await getRankings("recent", limit);
      items = rankings.items;
    }

    return ok({
      items,
      sort,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return fail(err);
  }
}
