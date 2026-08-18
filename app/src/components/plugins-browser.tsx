"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { GradeBadge } from "@/components/grade-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatRelativeTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Grade, Plugin } from "@/types/api";

const PAGE_SIZE = 50;

interface PluginsBrowserProps {
  initialPlugins: Plugin[];
  initialTotal: number;
}

type SortField = "score" | "stars" | "lastPush" | "updatedAt";
type SortOrder = "asc" | "desc";

export function PluginsBrowser({ initialPlugins, initialTotal }: PluginsBrowserProps) {
  const t = useTranslations("plugins");
  const th = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale() as "en" | "zh";

  const [plugins, setPlugins] = React.useState<Plugin[]>(initialPlugins);
  const [total, setTotal] = React.useState(initialTotal);
  const [page, setPage] = React.useState(1);
  const [query, setQuery] = React.useState("");
  const [grade, setGrade] = React.useState<Grade | "all">("all");
  const [sort, setSort] = React.useState<SortField>("score");
  const [order, setOrder] = React.useState<SortOrder>("desc");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = React.useCallback(
    async (opts: { page: number; q: string; grade: Grade | "all"; sort: SortField; order: SortOrder }) => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          page: String(opts.page),
          limit: String(PAGE_SIZE),
          sort: opts.sort,
          order: opts.order,
        });
        if (opts.q.trim()) params.set("q", opts.q.trim());
        if (opts.grade !== "all") params.set("grade", opts.grade);

        const res = await fetch(`/api/v1/plugins?${params.toString()}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("bad status");
        const envelope = (await res.json()) as {
          code: number;
          data: { items: Plugin[]; total: number } | null;
        };
        if (envelope.code !== 0 || !envelope.data) throw new Error("bad envelope");
        setPlugins(envelope.data.items);
        setTotal(envelope.data.total);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      load({ page: 1, q: query, grade, sort, order });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, grade, sort, order, load]);

  const changePage = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
    load({ page: next, q: query, grade, sort, order });
  };

  const toggleSort = (field: SortField) => {
    if (sort === field) {
      setOrder(order === "desc" ? "asc" : "desc");
    } else {
      setSort(field);
      setOrder("desc");
    }
    setPage(1);
  };

  const sortIcon = (field: SortField) => {
    if (sort !== field) return null;
    return order === "desc" ? " ↓" : " ↑";
  };

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-[var(--color-text)]">
          <SlidersHorizontal className="h-7 w-7 text-[var(--color-primary)]" aria-hidden="true" />
          {t("title")}
        </h1>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-[var(--color-muted)]">
          {t("subtitle", { total: formatNumber(total) })}
        </p>
      </div>

      {/* 搜索 + 等级筛选 */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-meta)] transition-colors duration-fast ease-standard focus:border-[var(--color-primary)] focus:outline-none focus:shadow-focus"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "A", "B", "C", "D"] as Array<Grade | "all">).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGrade(g);
                setPage(1);
              }}
              aria-pressed={grade === g}
              className={cn(
                "inline-flex items-center rounded-[var(--radius-full)] border px-3 py-1.5 text-xs font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:shadow-focus",
                grade === g
                  ? "border-transparent bg-[var(--color-primary)] text-[var(--color-primary-on)]"
                  : "border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]"
              )}
            >
              {g === "all" ? t("gradeFilter.all") : g}
            </button>
          ))}
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-hidden rounded-[var(--table-radius)] border border-[var(--table-border)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("table.plugin")}</TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("score")} className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:shadow-focus rounded-[var(--radius-sm)]">
                  {t("table.score")}
                  <span className="text-[var(--color-meta)]">{sortIcon("score")}</span>
                </button>
              </TableHead>
              <TableHead>{t("table.grade")}</TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("stars")} className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:shadow-focus rounded-[var(--radius-sm)]">
                  {t("table.stars")}
                  <span className="text-[var(--color-meta)]">{sortIcon("stars")}</span>
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("lastPush")} className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:shadow-focus rounded-[var(--radius-sm)]">
                  {t("table.lastPush")}
                  <span className="text-[var(--color-meta)]">{sortIcon("lastPush")}</span>
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="p-10 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--color-primary)]" aria-hidden="true" />
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{t("loading")}</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="p-10 text-center">
                  <p className="text-sm text-[var(--color-danger)]">{t("error")}</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => load({ page, q: query, grade, sort, order })}>
                    {tc("actions.retry")}
                  </Button>
                </TableCell>
              </TableRow>
            ) : plugins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-10 text-center">
                  <p className="text-sm text-[var(--color-text-2)]">{t("empty")}</p>
                </TableCell>
              </TableRow>
            ) : (
              plugins.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-80">
                    <Link
                      href={`/plugin/${p.name}`}
                      className="block truncate rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-text)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus"
                    >
                      {p.name}
                    </Link>
                    {p.description ? (
                      <span className="mt-0.5 block truncate text-xs text-[var(--color-meta)]">
                        {p.description}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums text-sm font-medium text-[var(--color-text)]">
                      {p.score}
                    </span>
                  </TableCell>
                  <TableCell>
                    <GradeBadge grade={p.grade} size="sm" />
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums text-sm text-[var(--color-muted)]">
                      {formatNumber(p.stars)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums text-sm text-[var(--color-muted)]">
                      {formatRelativeTime(p.lastPush, locale)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-[var(--color-meta)]">
          {th("table.page", { page: String(page), total: String(totalPages) })}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => changePage(page - 1)}>
            {th("table.prev")}
          </Button>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>
            {th("table.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
