"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "success" | "error";

interface NewsletterSubscribeProps {
  /** Which placement rendered this form (footer / home / web) */
  source?: "web" | "footer" | "home";
  /** Compact layout for the footer */
  compact?: boolean;
  className?: string;
}

export function NewsletterSubscribe({
  source = "web",
  compact = false,
  className,
}: NewsletterSubscribeProps) {
  const t = useTranslations("weekly.subscribe");
  const locale = useLocale();
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    if (status !== "idle" && status !== "loading") {
      const timer = setTimeout(() => setStatus("idle"), 6000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg(t("invalid"));
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          locale: locale === "zh" ? "zh" : "en",
          source,
        }),
      });
      const envelope = (await res.json()) as {
        code: number;
        message?: string;
      };
      if (!res.ok || envelope.code !== 0) {
        setErrorMsg(envelope.message ?? t("error"));
        setStatus("error");
        return;
      }
      setEmail("");
      setStatus("success");
    } catch {
      setErrorMsg(t("error"));
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        className={cn(
          "flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm text-[var(--color-success)]",
          className
        )}
        role="status"
      >
        <CheckCircle2
          className="mt-0.5 h-4 w-4 shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium">{t("successTitle")}</p>
          <p className="mt-0.5 text-xs opacity-90">{t("successBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full flex-col gap-2",
        compact ? "sm:flex-row sm:items-center" : "sm:flex-row",
        className
      )}
      noValidate
    >
      <div className="relative flex-1">
        <Mail
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
          aria-hidden="true"
        />
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("label")}
          aria-invalid={status === "error"}
          className={cn(
            "h-10 w-full rounded-[var(--btn-radius)] border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-meta)] transition-colors duration-fast ease-standard focus:border-[var(--color-primary)] focus:outline-none focus:shadow-focus",
            status === "error" &&
              "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
          )}
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--btn-radius)] bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-text)] transition-colors duration-fast ease-standard hover:bg-[var(--btn-primary-hover)] focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("submitting")}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" />
            {t("cta")}
          </>
        )}
      </button>
      {status === "error" ? (
        <p className="text-xs text-[var(--color-danger)]" role="alert">
          {errorMsg}
        </p>
      ) : null}
    </form>
  );
}
