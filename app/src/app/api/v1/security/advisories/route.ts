// GET /api/v1/security/advisories - CVE-style security advisories (v0.3)
// Filterable by severity (critical|high|medium|low) and status (active|resolved|investigating)
// Response: { code: 0, data: { items: SecurityAdvisory[], total: number } }

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import {
  getCachedAdvisories,
  parseSeverity,
  parseAdvisoryStatus,
} from "@/services/advisory-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await rateLimit(`advisories:${ip}`);

    const searchParams = req.nextUrl.searchParams;

    let limit = 100;
    const limitRaw = searchParams.get("limit");
    if (limitRaw !== null) {
      limit = Number(limitRaw);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw ApiError.badParam("Invalid parameter: limit must be between 1 and 100", "limit");
      }
    }

    const severity = parseSeverity(searchParams.get("severity"));
    const status = parseAdvisoryStatus(searchParams.get("status"));

    const data = await getCachedAdvisories({ severity, status, limit });
    return ok(data);
  } catch (err) {
    return fail(err);
  }
}
