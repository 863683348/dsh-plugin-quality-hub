"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Search,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AdvisorySeverity,
  AdvisoryStatus,
  SecurityAdvisory,
} from "@/types/api";

const severityStyles: Record<AdvisorySeverity, { badge: string; dot: string; label: string }> = {
  critical: {
    badge: "bg-[var(--color-danger)] text-white",
    dot: "bg-[var(--color-danger)]",
    label: "text-[var(--color-danger)]",
  },
  high: {
    badge: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-danger)]",
    dot: "bg-[var(--color-danger)]",
    label: "text-[var(--color-danger)]",
  },
  medium: {
    badge: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border border-[var(--color-warning)]",
    dot: "bg-[var(--color-warning)]",
    label: "text-[var(--color-warning)]",
  },
  low: {
    badge: "bg-[var(--color-info-soft)] text-[var(--color-info)] border border-[var(--color-info)]",
    dot: "bg-[var(--color-info)]",
    label: "text-[var(--color-info)]",
  },
};

const statusStyles: Record<AdvisoryStatus, string> = {
  active: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-danger)]",
  investigating:
    "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border border-[var(--color-warning)]",
  resolved: "bg-[var(--color-success-soft)] text-[var(--color-success)] border border-[var(--color-success)]",
};

const severityOrder: Record<AdvisorySeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface AdvisoryListProps {
  items: SecurityAdvisory[];
  total: number;
}

export function AdvisoryList({ items, total }: AdvisoryListProps) {
  const t = useTranslations("security.advisories");
  const locale = useLocale() as "en" | "zh";

  const [severityFilter, setSeverityFilter] = React.useState<AdvisorySeverity | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<AdvisoryStatus | "all">("all");
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((a) => severityFilter === "all" || a.severity === severityFilter)
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .filter((a) => {
        if (!q) return true;
        return (
          a.title.toLowerCase().includes(q) ||
          a.advisoryId.toLowerCase().includes(q) ||
          a.pluginName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const sa = severityOrder[a.severity];
        const sb = severityOrder[b.severity];
        if (sa !== sb) return sa - sb;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
  }, [items, severityFilter, statusFilter, query]);

  const countFor = (s: AdvisorySeverity) =>
    items.filter((a) => a.severity === s).length;

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-meta)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-8 w-48 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] pl-8 pr-3 text-xs text-[var(--color-text)] placeholder:text-[var(--color-meta)] focus:border-[var(--color-primary)] focus:outline-none focus:shadow-focus sm:w-56"
          />
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {(["critical", "high", "medium", "low"] as AdvisorySeverity[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverityFilter(severityFilter === s ? "all" : s)}
              aria-pressed={severityFilter === s}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border px-3 py-1.5 text-xs font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:shadow-focus",
                severityFilter === s
                  ? severityStyles[s].badge
                  : "border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", severityStyles[s].dot)} />
              {t(`severity.${s}`)}
              <span className="tabular-nums opacity-80">{countFor(s)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        {(["all", "active", "investigating", "resolved"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            aria-pressed={statusFilter === s}
            className={cn(
              "rounded-[var(--radius-full)] border px-3 py-1 text-xs font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:shadow-focus",
              statusFilter === s
                ? "border-transparent bg-[var(--color-primary)] text-[var(--color-primary-on)]"
                : "border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
            )}
          >
            {t(`status.${s}`)}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-10 text-center">
          <ShieldAlert
            className="mx-auto h-8 w-8 text-[var(--color-meta)]"
            aria-hidden="true"
          />
          <p className="mt-3 text-base font-medium text-[var(--color-text-2)]">
            {t("empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => {
            const isOpen = expanded === a.id;
            const sev = severityStyles[a.severity];
            return (
              <li
                key={a.id}
                className={cn(
                  "overflow-hidden rounded-[var(--card-radius)] border bg-[var(--card-bg)] transition-colors duration-fast ease-standard",
                  a.severity === "critical"
                    ? "border-[var(--color-danger)]/60"
                    : "border-[var(--card-border)]"
                )}
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:shadow-focus sm:px-5"
                >
                  <AlertOctagon
                    className={cn("h-4 w-4 shrink-0", sev.label)}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="label-caps text-[var(--color-meta)]">
                        {a.advisoryId}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-[var(--radius-full)] px-2 py-0.5 text-[10px] font-semibold",
                          sev.badge
                        )}
                      >
                        {t(`severity.${a.severity}`)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-[var(--radius-full)] px-2 py-0.5 text-[10px] font-semibold",
                          statusStyles[a.status]
                        )}
                      >
                        {t(`status.${a.status}`)}
                      </span>
                    </div>
                    <h3 className="mt-1 truncate text-sm font-medium text-[var(--color-text)]">
                      {a.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--color-meta)]">
                      <span className="tabular-nums">
                        {new Date(a.publishedAt).toISOString().slice(0, 10)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        {a.pluginName}
                      </span>
                      {a.status === "resolved" && a.resolvedAt ? (
                        <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          {new Date(a.resolvedAt).toISOString().slice(0, 10)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-[var(--color-meta)] transition-transform duration-fast ease-standard",
                      isOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {/* Expandable body */}
                {isOpen ? (
                  <div className="border-t border-[var(--color-border)] px-4 py-4 sm:px-5">
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="label-caps text-[var(--color-meta)]">
                          {t("detail.affectedRange")}
                        </dt>
                        <dd className="mt-1 text-sm text-[var(--color-text-2)]">
                          {a.affectedRange}
                        </dd>
                      </div>
                      <div>
                        <dt className="label-caps text-[var(--color-meta)]">
                          {t("detail.status")}
                        </dt>
                        <dd className="mt-1 text-sm text-[var(--color-text-2)]">
                          {t(`status.${a.status}`)}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="label-caps text-[var(--color-meta)]">
                          {t("detail.description")}
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-[var(--color-text-2)]">
                          {a.description}
                        </dd>
                      </div>
                      {a.plugin ? (
                        <div className="sm:col-span-2">
                          <dt className="label-caps text-[var(--color-meta)]">
                            {t("detail.affectedPlugin")}
                          </dt>
                          <dd className="mt-1">
                            <Link
                              href={`/plugin/${a.plugin.name}`}
                              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors duration-fast ease-standard hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus"
                            >
                              {a.plugin.name}
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer note */}
      <div className="mt-6 flex items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--color-info)] bg-[var(--color-info-soft)] p-4 text-sm leading-relaxed text-[var(--color-text-2)]">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-info)]" aria-hidden="true" />
        <p>{t("notice")}</p>
      </div>
    </div>
  );
}
