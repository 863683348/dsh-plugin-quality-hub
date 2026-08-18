// POST /api/v1/refresh - manual data refresh (internal, requires CRON_SECRET)
// docs/api/api-spec.md §2.6

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";
import { canRefresh, runRefresh } from "@/services/refresh-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REFRESH_COOLDOWN_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate with CRON_SECRET
    const auth = req.headers.get("authorization") ?? "";
    const expected = process.env.CRON_SECRET;
    if (!expected || auth !== `Bearer ${expected}`) {
      throw ApiError.unauthorized("Unauthorized: invalid CRON_SECRET");
    }

    // 2. Cooldown check (30 min)
    const { allowed, retryAfter } = await canRefresh();
    if (!allowed) {
      const retryAt = retryAfter ?? new Date(Date.now() + REFRESH_COOLDOWN_MS);
      throw ApiError.rateLimited(
        `Refresh too frequent, retry after ${retryAt.toISOString()}`
      );
    }

    // 3. Fire-and-forget async refresh (per spec: immediate return)
    const updatedAt = new Date();
    void runRefresh("manual")
      .then((outcome) => {
        console.log(
          `[refresh] complete: fetched=${outcome.pluginsFetched} updated=${outcome.pluginsUpdated} errors=${outcome.errors.length}`
        );
        // Revalidate pages after data refresh (api-spec §4.3)
        import("next/cache")
          .then(({ revalidatePath, revalidateTag }) => {
            revalidatePath("/");
            revalidatePath("/trending");
            revalidatePath("/security");
            revalidateTag("plugins");
          })
          .catch(() => undefined);
      })
      .catch((err) => {
        console.error("[refresh] failed:", err);
      });

    return ok({ success: true, updatedAt: updatedAt.toISOString() });
  } catch (err) {
    return fail(err);
  }
}
