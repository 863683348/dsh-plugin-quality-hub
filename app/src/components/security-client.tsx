'use client';

import * as React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Archive,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { GradeBadge } from '@/components/grade-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SecurityFlagType, SecurityItem } from '@/types/api';

type Filter = 'all' | SecurityFlagType;

const filterStyles: Record<Filter, { active: string; Icon?: typeof AlertOctagon }> = {
  all: { active: 'bg-[var(--color-primary)] text-[var(--color-primary-on)] border-transparent' },
  danger: { active: 'bg-[var(--color-danger)] text-white border-transparent', Icon: AlertOctagon },
  warning: { active: 'bg-[var(--color-warning)] text-white border-transparent', Icon: AlertTriangle },
  info: { active: 'bg-[var(--color-info)] text-white border-transparent', Icon: Info },
};

const legendConfig: Array<{
  type: SecurityFlagType;
  Icon: typeof AlertOctagon;
  color: string;
  labelKey: 'danger' | 'warning' | 'info';
}> = [
  { type: 'danger', Icon: AlertOctagon, color: 'var(--color-danger)', labelKey: 'danger' },
  { type: 'warning', Icon: AlertTriangle, color: 'var(--color-warning)', labelKey: 'warning' },
  { type: 'info', Icon: Archive, color: 'var(--color-info)', labelKey: 'info' },
];

interface SecurityClientProps {
  items: SecurityItem[];
  total: number;
}

export function SecurityClient({ items, total }: SecurityClientProps) {
  const t = useTranslations('security');
  const locale = useLocale() as 'en' | 'zh';
  const [filter, setFilter] = React.useState<Filter>('all');

  const counts: Record<Filter, number> = React.useMemo(() => {
    const c: Record<Filter, number> = { all: total, danger: 0, warning: 0, info: 0 };
    for (const item of items) {
      for (const flag of item.flags) {
        c[flag.type] += 1;
      }
    }
    return c;
  }, [items, total]);

  const filtered = React.useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) =>
      item.flags.some((flag) => flag.type === filter)
    );
  }, [items, filter]);

  // danger 优先 → warning → info，同类型时间新→旧
  const sorted = React.useMemo(() => {
    const order: Record<SecurityFlagType, number> = { danger: 0, warning: 1, info: 2 };
    return [...filtered].sort((a, b) => {
      const aMin = Math.min(...a.flags.map((f) => order[f.type]));
      const bMin = Math.min(...b.flags.map((f) => order[f.type]));
      if (aMin !== bMin) return aMin - bMin;
      return (
        new Date(b.plugin.lastPush ?? 0).getTime() -
        new Date(a.plugin.lastPush ?? 0).getTime()
      );
    });
  }, [filtered]);

  const primaryFlag = (item: SecurityItem) =>
    [...item.flags].sort((a, b) => {
      const order: Record<SecurityFlagType, number> = { danger: 0, warning: 1, info: 2 };
      return order[a.type] - order[b.type];
    })[0];

  const flagLabel = (type: SecurityFlagType) => {
    switch (type) {
      case 'danger':
        return t('legend.danger');
      case 'warning':
        return t('legend.warning');
      case 'info':
        return t('legend.info');
    }
  };

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-[var(--color-text)]">
          <ShieldAlert className="h-7 w-7 text-[var(--color-danger)]" aria-hidden="true" />
          {t('title')}
        </h1>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-[var(--color-muted)]">
          {t('subtitle')}
        </p>
      </div>

      {/* FlagFilter */}
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter">
        {(['all', 'danger', 'warning', 'info'] as Filter[]).map((f) => {
          const isActive = filter === f;
          const Icon = filterStyles[f].Icon;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border px-3 py-1.5 text-xs font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:shadow-focus',
                isActive
                  ? filterStyles[f].active
                  : 'border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
              )}
              aria-pressed={isActive}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              {t(`filter.${f}`)}
              <span className="tabular-nums opacity-80">{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {/* FlagLegend */}
      <div className="mb-8 rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--card-bg)] p-4">
        <p className="label-caps mb-3 text-[var(--color-meta)]">
          {t('legend.title')}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {legendConfig.map(({ type, Icon, color, labelKey }) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4 shrink-0" style={{ color }} aria-hidden="true" />
              <span className="text-[var(--color-text-2)]">
                {t(`legend.${labelKey}`)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SecurityTable — 桌面表格 */}
      <div className="hidden overflow-hidden rounded-[var(--table-radius)] border border-[var(--table-border)] md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('table.plugin')}</TableHead>
              <TableHead>{t('table.type')}</TableHead>
              <TableHead>{t('table.detail')}</TableHead>
              <TableHead>{t('table.grade')}</TableHead>
              <TableHead>{t('table.lastPush')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <p className="text-base font-medium text-[var(--color-text-2)]">
                      {t('table.empty')}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setFilter('all')}
                    >
                      {t('table.emptyAction')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((item) => {
                const flag = primaryFlag(item);
                const isDanger = flag.type === 'danger';
                return (
                  <TableRow
                    key={item.plugin.id}
                    className={cn(
                      'cursor-pointer',
                      isDanger && 'bg-[var(--color-danger-soft)] hover:bg-[var(--color-danger-soft)]'
                    )}
                  >
                    <TableCell className="max-w-64">
                      <Link
                        href={`/plugin/${item.plugin.name}`}
                        className="block truncate rounded-[var(--radius-sm)] text-sm font-medium text-[var(--color-text)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus"
                      >
                        {item.plugin.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-sm font-medium',
                          flag.type === 'danger'
                            ? 'text-[var(--color-danger)]'
                            : flag.type === 'warning'
                              ? 'text-[var(--color-warning)]'
                              : 'text-[var(--color-info)]'
                        )}
                      >
                        {flagLabel(flag.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-72 truncate text-sm text-[var(--color-muted)]" title={flag.detail}>
                        {flag.detail}
                      </span>
                    </TableCell>
                    <TableCell>
                      <GradeBadge grade={item.plugin.grade} size="sm" />
                    </TableCell>
                    <TableCell>
                      <span className="tabular-nums text-sm text-[var(--color-muted)]">
                        {formatRelativeTime(item.plugin.lastPush, locale)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 移动端卡片 */}
      <div className="space-y-3 md:hidden">
        {sorted.length === 0 ? (
          <div className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center">
            <p className="text-base font-medium text-[var(--color-text-2)]">
              {t('table.empty')}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => setFilter('all')}
            >
              {t('table.emptyAction')}
            </Button>
          </div>
        ) : (
          sorted.map((item) => {
            const flag = primaryFlag(item);
            const isDanger = flag.type === 'danger';
            return (
              <Link
                key={item.plugin.id}
                href={`/plugin/${item.plugin.name}`}
                className={cn(
                  'block rounded-[var(--card-radius)] border p-4 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:shadow-focus',
                  isDanger
                    ? 'border-[var(--color-danger)] bg-[var(--color-danger-soft)]'
                    : 'border-[var(--card-border)] bg-[var(--card-bg)]'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-[var(--color-text)]">
                    {item.plugin.name}
                  </span>
                  <GradeBadge grade={item.plugin.grade} size="sm" />
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-sm font-medium',
                      flag.type === 'danger'
                        ? 'text-[var(--color-danger)]'
                        : flag.type === 'warning'
                          ? 'text-[var(--color-warning)]'
                          : 'text-[var(--color-info)]'
                    )}
                  >
                    {flagLabel(flag.type)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {flag.detail}
                </p>
                <p className="mt-2 tabular-nums text-xs text-[var(--color-meta)]">
                  {t('table.lastPush')}:{' '}
                  {formatRelativeTime(item.plugin.lastPush, locale)}
                </p>
              </Link>
            );
          })
        )}
      </div>

      {/* 安全声明 */}
      <div className="mt-8 flex items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--color-info)] bg-[var(--color-info-soft)] p-4 text-sm leading-relaxed text-[var(--color-text-2)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-info)]" aria-hidden="true" />
        <p>{t('notice')}</p>
      </div>
    </div>
  );
}
