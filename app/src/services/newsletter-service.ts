// Newsletter subscription service (v0.2 - DSH Weekly)
// Local Neon table is the source of truth; Buttondown is the delivery channel.
// When BUTTONDOWN_API_KEY is configured, subscribers are also pushed to
// Buttondown so the weekly digest can be emailed out. Without the key we
// still record the subscription locally (status = "pending") so no signups
// are lost — ops can sync later.

import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

export interface SubscribeOptions {
  locale?: "en" | "zh";
  source?: "web" | "footer" | "home";
}

export interface SubscribeResult {
  subscribed: boolean;
  status: "subscribed" | "pending";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

function buttondownApiKey(): string | undefined {
  const key = process.env.BUTTONDOWN_API_KEY;
  return key && key.length > 0 ? key : undefined;
}

async function pushToButtondown(
  email: string,
  locale: string,
  source: string
): Promise<boolean> {
  const apiKey = buttondownApiKey();
  if (!apiKey) return false;

  try {
    const res = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        type: "regular",
        metadata: {
          locale,
          source,
          site: "dsh-quality-hub",
        },
      }),
      // Buttondown can be slow on cold start; don't block the response forever
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(
        `[newsletter] buttondown sync failed: ${res.status} ${await res.text().catch(() => "")}`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[newsletter] buttondown request error:", err);
    return false;
  }
}

/**
 * Subscribe an email to DSH Weekly.
 * - Validates email format (ApiError.badParam when invalid)
 * - Upserts the local subscriber row (email unique)
 * - Best-effort sync to Buttondown; on failure keeps local row as "pending"
 */
export async function subscribeEmail(
  email: string,
  opts: SubscribeOptions = {}
): Promise<SubscribeResult> {
  const normalized = email.trim().toLowerCase();
  if (!validateEmail(normalized)) {
    throw ApiError.badParam("Invalid email address", "email");
  }

  const locale = opts.locale === "zh" ? "zh" : "en";
  const source = opts.source ?? "web";

  // Upsert local row
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalized },
  });

  let row;
  if (existing) {
    if (existing.status === "unsubscribed") {
      // Re-subscribe
      row = await prisma.newsletterSubscriber.update({
        where: { email: normalized },
        data: { status: "subscribed", locale, source, updatedAt: new Date() },
      });
    } else {
      row = await prisma.newsletterSubscriber.update({
        where: { email: normalized },
        data: { locale, source, updatedAt: new Date() },
      });
    }
  } else {
    row = await prisma.newsletterSubscriber.create({
      data: { email: normalized, locale, source, status: "subscribed" },
    });
  }

  // Best-effort Buttondown sync
  const synced = await pushToButtondown(normalized, locale, source);
  if (!synced) {
    // Downgrade to pending locally so ops knows it wasn't delivered to Buttondown
    await prisma.newsletterSubscriber
      .update({
        where: { email: normalized },
        data: { status: "pending" },
      })
      .catch(() => undefined);
    return { subscribed: true, status: "pending" };
  }

  return { subscribed: true, status: "subscribed" };
}

/** Count of active subscribers (used by the site stats) */
export async function countSubscribers(): Promise<number> {
  try {
    const count = await prisma.newsletterSubscriber.count({
      where: { status: "subscribed" },
    });
    return count;
  } catch {
    return 0;
  }
}
