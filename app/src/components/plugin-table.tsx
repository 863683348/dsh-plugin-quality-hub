'use client';

import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { GradeBadge } from '@/components/grade-badge';
import { SecurityFlag } from '@/components/security-flag';
import { formatCompact, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Plugin } from '@/types/api';

interface PluginTableProps {
  plugins: Plugin[];
  loading?: boolean;
  error?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
  onClearSearch?: () => void;
  searchActive?: boolean;
}

/** 空状态 */
function EmptyState({
  searchActive,
  onClearSearch,
}: {
  searchActive: boolean;
  onClearSearch?: () => void;
}) {
  const t = useTranslations('home');
  const tc = useTranslations('common');
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <SearchX className="h-10 w-10 text-[var(--color-meta)]" aria-hidden="true" />
      <p className="text-base font-medium text-[var(--color-text-2)]">
        {searchActive ? t('search.emptyTitle') : t('table.empty')}
      </p>
      {searchActive ? (
        <Button variant="secondary" size="sm" onClick={onClearSearch}>
          {tc('actions.clearFilters')}
        </Button>
      ) : null}
    </div>
  );
}

/** 加载骨架屏（5 行 shimmer） */
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}>
              <div className="h-4 w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-3)]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/** 桌面表格行 */
function DesktopRow({ plugin, index }: { plugin: Plugin; index: number }) {
  const t = useTranslations('home.table');
  const locale = useLocale() as 'en' | 'zh';
  const top3 = index < 3;

  return (
    <TableRow className="cursor-pointer">
      <TableCell className="w-14">
        <span
          className={cn(
            'tabular-nums text-sm',
            top3
              ? 'font-bold text-[var(--color-primary)]'
              : 'text-[var(--color-muted)]'
          )}
        >
          {index + 1}
        </span>
      </TableCell>
      <TableCell className="max-w-64">
        <Link
          href={`/plugin/${plugin.name}`}
          className="block truncate text-sm font-medium text-[var(--color-text)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus rounded-[var(--radius-sm)]"
        >
          {plugin.name}
        </Link>
      </TableCell>
      <TableCell>
        <GradeBadge grade={plugin.grade} size="sm" />
      </TableCell>
      <TableCell>
        <span className="tabular-nums text-sm font-medium text-[var(--color-text-2)]">
          {plugin.score}
        </span>
      </TableCell>
      <TableCell>
        <span className="tabular-nums text-sm text-[var(--color-text-2)]">
          {formatCompact(plugin.stars)}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-[var(--color-muted)]">
          {formatRelativeTime(plugin.lastPush, locale)}
        </span>
      </TableCell>
      <TableCell className="w-52">
        {plugin.flags.length > 0 ? (
          <div className="flex flex-col gap-1">
            {plugin.flags.slice(0, 2).map((flag, i) => (
              <SecurityFlag
                key={i}
                type={flag.type}
                label={flag.label}
                emphasized={flag.type === 'danger'}
              />
            ))}
          </div>
        ) : (
          <span className="text-sm text-[var(--color-meta)]">
            {t('noFlags')}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

/** 移动端折叠卡片 */
function MobileCard({ plugin, index }: { plugin: Plugin; index: number }) {
  const t = useTranslations('home.table');
  const locale = useLocale() as 'en' | 'zh';

  return (
    <Link
      href={`/plugin/${plugin.name}`}
      className="block rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition-colors duration-fast ease-standard hover:border-[var(--card-hover-border)] focus-visible:outline-none focus-visible:shadow-focus"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'tabular-nums text-sm',
              index < 3
                ? 'font-bold text-[var(--color-primary)]'
                : 'text-[var(--color-muted)]'
            )}
          >
            {index + 1}
          </span>
          <span className="truncate text-sm font-medium text-[var(--color-text)]">
            {plugin.name}
          </span>
        </div>
        <GradeBadge grade={plugin.grade} size="sm" />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-[var(--color-muted)]">{t('score')}</span>
        <span className="tabular-nums font-medium text-[var(--color-text-2)]">
          {plugin.score}
          <span className="text-[var(--color-meta)]">/100</span>
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-sm">
        <span className="text-[var(--color-muted)]">{t('stars')}</span>
        <span className="tabular-nums text-[var(--color-text-2)]">
          {formatCompact(plugin.stars)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-sm">
        <span className="text-[var(--color-muted)]">{t('lastPush')}</span>
        <span className="text-[var(--color-muted)]">
          {formatRelativeTime(plugin.lastPush, locale)}
        </span>
      </div>
      <div className="mt-3 border-t border-[var(--color-border)] pt-3">
        {plugin.flags.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {plugin.flags.slice(0, 2).map((flag, i) => (
              <SecurityFlag
                key={i}
                type={flag.type}
                label={flag.label}
                emphasized={flag.type === 'danger'}
              />
            ))}
          </div>
        ) : (
          <span className="text-sm text-[var(--color-meta)]">
            {t('noFlags')}
          </span>
        )}
      </div>
    </Link>
  );
}

/**
 * PluginTable — 桌面表格（7 列）→ 移动端折叠卡片（<md）
 * 排名前 3 主色加粗；行 hover surface-2；安全列始终可见
 */
export function PluginTable({
  plugins,
  loading = false,
  error = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRetry,
  onClearSearch,
  searchActive = false,
}: PluginTableProps) {
  const t = useTranslations('home');
  const tc = useTranslations('common');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] py-16 text-center">
        <p className="text-base font-medium text-[var(--color-text-2)]">
          {t('table.error')}
        </p>
        {onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {tc('actions.retry')}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {/* 桌面表格 */}
      <div className="hidden overflow-hidden rounded-[var(--table-radius)] border border-[var(--table-border)] md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-14">{t('table.rank')}</TableHead>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.grade')}</TableHead>
              <TableHead>{t('table.score')}</TableHead>
              <TableHead>{t('table.stars')}</TableHead>
              <TableHead>{t('table.lastPush')}</TableHead>
              <TableHead>{t('table.security')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonRows />
            ) : plugins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    searchActive={searchActive}
                    onClearSearch={onClearSearch}
                  />
                </TableCell>
              </TableRow>
            ) : (
              plugins.map((plugin, i) => (
                <DesktopRow key={plugin.id} plugin={plugin} index={i} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 移动端折叠卡片 */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)]"
            />
          ))
        ) : plugins.length === 0 ? (
          <div className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)]">
            <EmptyState
              searchActive={searchActive}
              onClearSearch={onClearSearch}
            />
          </div>
        ) : (
          plugins.map((plugin, i) => (
            <MobileCard key={plugin.id} plugin={plugin} index={i} />
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && !loading && (
        <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {t('table.prev')}
          </Button>
          <span className="text-sm text-[var(--color-muted)]">
            {t('table.page', { page, total: totalPages })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            {t('table.next')}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
