"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdSlotConfig {
  id: string;
  placement: string;
  label: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}

interface AdSlotProps {
  slot: AdSlotConfig;
  /** banner = 横向横幅；side = 侧栏窄卡 */
  variant?: "banner" | "side";
  className?: string;
}

/**
 * 广告位（v0.4 商业化）
 * 硬约束：广告内容只出现在明确标注 Sponsored 的区域，不参与评分/排序/安全评级。
 * 由 src/config/ads.json 驱动；adsEnabled=false 时不渲染。
 */
export function AdSlot({ slot, variant = "banner", className }: AdSlotProps) {
  const t = useTranslations("sponsor");

  return (
    <a
      href={slot.href}
      target={slot.href.startsWith("http") ? "_blank" : undefined}
      rel={slot.href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={cn(
        "group block rounded-[var(--card-radius)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-2)] transition-colors duration-fast ease-standard hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus",
        variant === "banner"
          ? "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          : "p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Megaphone className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="label-caps flex items-center gap-1.5 text-[var(--color-meta)]">
            {slot.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {slot.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">
            {slot.body}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-[var(--btn-radius)] border border-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors duration-fast ease-standard group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-primary-on)]",
          variant === "banner" ? "" : "mt-2"
        )}
      >
        {slot.cta}
      </span>
    </a>
  );
}

/**
 * 推荐位（v0.4 商业化）
 * 用于推广官方/合作内容（如 DSH Weekly）。同样明确标注 Partner，不影响评分。
 */
export function PromoSlot({
  slot,
  className,
}: {
  slot: AdSlotConfig;
  className?: string;
}) {
  return (
    <a
      href={slot.href}
      className={cn(
        "group flex items-center gap-3 rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--card-bg)] p-4 transition-colors duration-fast ease-standard hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus",
        className
      )}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-success-soft)] text-[var(--color-success)]">
        <BadgeCheck className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="label-caps flex items-center gap-1.5 text-[var(--color-meta)]">
          {slot.label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-text)]">
          {slot.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-muted)]">
          {slot.body}
        </p>
      </div>
      <span className="shrink-0 text-xs font-medium text-[var(--color-primary)]">
        {slot.cta}
      </span>
    </a>
  );
}
