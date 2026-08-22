"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const SITE_BASE = "https://dshquality.com";

/**
 * 质量徽章嵌入卡 — 详情页侧栏复用。
 * 展示徽章预览，并提供 Markdown / HTML 两种 README 嵌入代码 + 一键复制。
 */
export function BadgeEmbed({ name }: { name: string }) {
  const t = useTranslations("plugin");

  const markdown = `![DSH Quality](${SITE_BASE}/api/v1/badge/${name})`;
  const html = `<a href="${SITE_BASE}/plugin/${name}"><img src="${SITE_BASE}/api/v1/badge/${name}" alt="DSH Quality" /></a>`;

  const [tab, setTab] = useState<"md" | "html">("md");
  const [copied, setCopied] = useState(false);
  const code = tab === "md" ? markdown : html;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable in some contexts */
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/v1/badge/${name}`}
          alt={`DSH Quality badge for ${name}`}
          height={20}
        />
      </div>

      <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-1 text-xs">
        {(["md", "html"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-[var(--radius-sm)] px-2 py-1 font-medium transition-colors",
              tab === key
                ? "bg-[var(--color-surface)] text-[var(--color-text)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text-2)]"
            )}
          >
            {key === "md" ? t("badge.markdownLabel") : t("badge.htmlLabel")}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] px-2 py-1.5 font-mono text-xs text-[var(--color-text-2)]">
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] px-2 py-1.5 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
              {t("badge.copied")}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {t("badge.copy")}
            </>
          )}
        </button>
      </div>

      <p className="text-xs leading-relaxed text-[var(--color-muted)]">
        {t("badge.hint")}
      </p>
    </div>
  );
}
