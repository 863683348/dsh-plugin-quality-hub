'use client';

import { Activity, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { GradeBadge } from '@/components/grade-badge';
import { formatCompact, formatRelativeTime } from '@/lib/format';
import type { Plugin } from '@/types/api';

function TrendItem({
  plugin,
  index,
  metric,
}: {
  plugin: Plugin;
  index: number;
  metric: 'active' | 'starred';
}) {
  const locale = useLocale() as 'en' | 'zh';

  return (
    <Link
      href={plugin.githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:shadow-focus"
    >
      <span className="tabular-nums w-6 shrink-0 text-right text-sm text-[var(--color-meta)]">
        {index + 1}
      </span>
      <GradeBadge grade={plugin.grade} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text)]">
        {plugin.name}
      </span>
      {metric === 'active' ? (
        <span className="shrink-0 text-sm text-[var(--color-muted)]">
          {formatRelativeTime(plugin.lastPush, locale)}
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1 tabular-nums text-sm text-[var(--color-muted)]">
          <Star className="h-3.5 w-3.5 text-[var(--color-warning)]" aria-hidden="true" />
          {formatCompact(plugin.stars)}
        </span>
      )}
    </Link>
  );
}

interface TrendingClientProps {
  recentlyActive: Plugin[];
  mostStarred: Plugin[];
}

export function TrendingClient({
  recentlyActive,
  mostStarred,
}: TrendingClientProps) {
  const t = useTranslations('trending');

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {t('title')}
        </h1>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-[var(--color-muted)]">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 最近活跃 */}
        <section className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)]">
          <header className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-4">
            <Activity className="h-4 w-4 text-[var(--color-warning)]" aria-hidden="true" />
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
              {t('recentlyActive')}
            </h2>
          </header>
          <div className="divide-y divide-[var(--color-border)] py-1">
            {recentlyActive.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
                {t('recentlyActiveEmpty')}
              </p>
            ) : (
              recentlyActive.map((plugin, i) => (
                <div key={plugin.id} className="px-2 py-0.5">
                  <TrendItem plugin={plugin} index={i} metric="active" />
                </div>
              ))
            )}
          </div>
        </section>

        {/* 最多 Star */}
        <section className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)]">
          <header className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-4">
            <Star className="h-4 w-4 text-[var(--color-warning)]" aria-hidden="true" />
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
              {t('mostStarred')}
            </h2>
          </header>
          <div className="divide-y divide-[var(--color-border)] py-1">
            {mostStarred.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--color-muted)]">
                {t('mostStarredEmpty')}
              </p>
            ) : (
              mostStarred.map((plugin, i) => (
                <div key={plugin.id} className="px-2 py-0.5">
                  <TrendItem plugin={plugin} index={i} metric="starred" />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
