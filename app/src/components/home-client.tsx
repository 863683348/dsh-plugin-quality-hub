'use client';

import * as React from 'react';
import { Activity, Database, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search-bar';
import { GradeDistribution } from '@/components/grade-distribution';
import { PluginTable } from '@/components/plugin-table';
import { formatNumber } from '@/lib/format';
import type { Plugin } from '@/types/api';

const PAGE_SIZE = 20;

interface HomeClientProps {
  plugins: Plugin[];
  total: number;
  updatedAt: string;
}

export function HomeClient({ plugins, total, updatedAt }: HomeClientProps) {
  const t = useTranslations('home');
  const tc = useTranslations('common');

  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);

  // 客户端过滤（名称/作者/描述模糊匹配，AC-08）
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return plugins;
    return plugins.filter((p) => {
      const haystack = [
        p.name,
        p.owner,
        p.repoName,
        p.description ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [plugins, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 首页统计数据（真实产品内容，非抽象图形）
  const gradeACount = plugins.filter((p) => p.grade === 'A').length;
  const activeAlerts = plugins.filter((p) => p.flags.length > 0).length;

  React.useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <div className="container-page">
      {/* ===== Hero（非对称：左文案 + 右真实评分数据卡）===== */}
      <section className="grid gap-8 py-[var(--section-y-sm)] md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-[var(--section-y)]">
        <div>
          <p className="label-caps text-[var(--color-primary)]">
            {t('hero.eyebrow')}
          </p>
          <h1 className="mt-3 max-w-[16ch] text-4xl font-bold leading-tight tracking-tight text-[var(--color-text)]">
            {t('hero.title')}
          </h1>
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-[var(--color-muted)]">
            {t('hero.subtitle')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/">{tc('actions.browse')}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/method">{tc('actions.howWeScore')}</Link>
            </Button>
          </div>
        </div>

        {/* 右侧数据卡 — 展示真实评分数据 */}
        <div className="card">
          <div className="grid grid-cols-3 divide-x divide-[var(--color-border)]">
            <div className="flex flex-col items-center gap-1 px-2 text-center">
              <Database
                className="h-4 w-4 text-[var(--color-primary)]"
                aria-hidden="true"
              />
              <span className="tabular-nums text-2xl font-bold text-[var(--color-text)]">
                {formatNumber(total)}
              </span>
              <span className="text-xs leading-snug text-[var(--color-muted)]">
                {t('stats.evaluated')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 text-center">
              <ShieldCheck
                className="h-4 w-4 text-[var(--grade-a)]"
                aria-hidden="true"
              />
              <span className="tabular-nums text-2xl font-bold text-[var(--grade-a)]">
                {gradeACount}
              </span>
              <span className="text-xs leading-snug text-[var(--color-muted)]">
                {t('stats.gradeA')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 text-center">
              <Activity
                className="h-4 w-4 text-[var(--color-danger)]"
                aria-hidden="true"
              />
              <span className="tabular-nums text-2xl font-bold text-[var(--color-danger)]">
                {activeAlerts}
              </span>
              <span className="text-xs leading-snug text-[var(--color-muted)]">
                {t('stats.activeAlerts')}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
            <span className="text-xs text-[var(--color-meta)]">
              {t('hero.source')}
            </span>
            <span className="tabular-nums text-xs text-[var(--color-meta)]">
              {t('lastUpdated', {
                date: updatedAt ? updatedAt.slice(0, 10) : '—',
              })}
            </span>
          </div>
        </div>
      </section>

      {/* ===== 搜索栏 ===== */}
      <section className="pb-[var(--section-y-sm)] md:pb-8">
        <SearchBar value={query} onChange={setQuery} className="max-w-xl" />
      </section>

      {/* ===== 等级分布 ===== */}
      <section className="pb-[var(--section-y-sm)] md:pb-8">
        <GradeDistribution plugins={plugins} />
      </section>

      {/* ===== 排行榜 ===== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            {t('table.rank')}
          </h2>
        </div>
        <PluginTable
          plugins={pageItems}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          searchActive={query.trim().length > 0}
          onClearSearch={() => setQuery('')}
        />
      </section>
    </div>
  );
}
