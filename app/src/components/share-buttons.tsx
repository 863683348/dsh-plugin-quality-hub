"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  /** Absolute URL of the page being shared (defaults to current location) */
  url?: string;
  /** Share title (defaults to the weekly newsletter title) */
  title?: string;
  className?: string;
}

function buildShareLinks(url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return {
    hn: `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
  };
}

/**
 * Launch links for Hacker News / Reddit (v0.2 - "首发" sharing).
 * Opens the platform's submit dialog in a new tab so the reader can
 * post the DSH Weekly to their community.
 */
export function ShareButtons({
  url,
  title,
  className,
}: ShareButtonsProps) {
  const t = useTranslations("weekly.share");
  const [href, setHref] = React.useState<string | null>(null);

  React.useEffect(() => {
    setHref(url ?? window.location.href);
  }, [url]);

  const shareTitle = title ?? t("defaultTitle");

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]">
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t("label")}
      </span>
      {href ? (
        <>
          <a
            href={buildShareLinks(href, shareTitle).hn}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Hacker News
            <ExternalLink className="h-3 w-3 text-[var(--color-meta)]" aria-hidden="true" />
          </a>
          <a
            href={buildShareLinks(href, shareTitle).reddit}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Reddit
            <ExternalLink className="h-3 w-3 text-[var(--color-meta)]" aria-hidden="true" />
          </a>
        </>
      ) : null}
    </div>
  );
}
