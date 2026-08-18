// POST /api/v1/newsletter/subscribe - DSH Weekly subscription (v0.2)
// docs/api/api-spec.md §2.7
// Body: { email: string, locale?: "en" | "zh", source?: "web" | "footer" | "home" }
// Response: { code: 0, data: { subscribed: true, status: "subscribed" | "pending" } }

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/errors";
import { subscribeEmail } from "@/services/newsletter-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    // Tighter limit for newsletter signups (spam protection)
    await rateLimit(`newsletter:${ip}`, 10);

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      throw ApiError.badParam("Invalid JSON body");
    }

    const email = typeof body.email === "string" ? body.email : "";
    const localeRaw = body.locale;
    const locale = localeRaw === "zh" ? "zh" : "en";
    const sourceRaw = body.source;
    const source =
      sourceRaw === "home" || sourceRaw === "footer"
        ? sourceRaw
        : "web";

    const result = await subscribeEmail(email, { locale, source });
    return ok(result);
  } catch (err) {
    return fail(err);
  }
}
