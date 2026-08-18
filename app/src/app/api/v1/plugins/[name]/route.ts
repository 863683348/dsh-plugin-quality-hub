// GET /api/v1/plugins/[name] - plugin detail
// docs/api/api-spec.md §2.2

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { getCachedPluginDetail } from "@/services/plugin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAME_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await rateLimit(`plugin:${ip}`);

    const name = params.name;
    if (!NAME_PATTERN.test(name)) {
      throw ApiError.badParam(
        "Invalid parameter: name must match owner/repo pattern",
        "name"
      );
    }

    const data = await getCachedPluginDetail(name);
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}
