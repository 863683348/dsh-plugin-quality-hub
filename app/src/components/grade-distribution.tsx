'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradeBadge, GradeDot, type PluginGrade } from '@/components/grade-badge';
import type { Plugin } from '@/types/api';

const grades: PluginGrade[] = ['A', 'B', 'C', 'D'];

interface GradeDistributionProps {
  plugins: Plugin[];
}

/**
 * 等级分布卡 — 单条 stacked bar（A/B/C/D 四段）+ 图例 + 数量
 * 颜色：--grade-a/b/c/d
 */
export function GradeDistribution({ plugins }: GradeDistributionProps) {
  const t = useTranslations('home.distribution');

  const counts: Record<PluginGrade, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const p of plugins) {
    if (p.grade in counts) counts[p.grade as PluginGrade] += 1;
  }
  const total = Math.max(plugins.length, 1);

  const barColor: Record<PluginGrade, string> = {
    A: 'var(--grade-a)',
    B: 'var(--grade-b)',
    C: 'var(--grade-c)',
    D: 'var(--grade-d)',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-sm text-[var(--color-muted)]">{t('subtitle')}</p>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-2 w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-3)]"
          role="img"
          aria-label={t('title')}
        >
          {grades.map((g) =>
            counts[g] > 0 ? (
              <div
                key={g}
                style={{
                  width: `${(counts[g] / total) * 100}%`,
                  backgroundColor: barColor[g],
                }}
                className="h-full transition-[width] duration-slow ease-standard"
              />
            ) : null
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {grades.map((g) => (
            <div key={g} className="flex items-center gap-2">
              <GradeDot grade={g} />
              <span className="text-sm font-medium text-[var(--color-text-2)]">
                {g}
              </span>
              <span className="tabular-nums ml-auto text-sm text-[var(--color-muted)]">
                {counts[g]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4">
          <span className="label-caps text-[var(--color-meta)]">
            {t('title')}
          </span>
          {grades.map((g) => (
            <GradeBadge key={g} grade={g} size="sm" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
