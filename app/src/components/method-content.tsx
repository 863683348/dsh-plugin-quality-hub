'use client';

import { FileText, Network, Package, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GradeBadge, type PluginGrade } from '@/components/grade-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
const dimensionConfig = [
  { key: 'maintenance', Icon: Wrench, color: 'var(--color-primary)' },
  { key: 'docs', Icon: FileText, color: 'var(--color-info)' },
  { key: 'npm', Icon: Package, color: 'var(--color-success)' },
  { key: 'ecosystem', Icon: Network, color: 'var(--color-warning)' },
] as const;

const weightTableRows = [
  { key: 'maintenance', weight: 28 },
  { key: 'docs', weight: 28 },
  { key: 'npm', weight: 24 },
  { key: 'ecosystem', weight: 20 },
] as const;

const gradeLegendRows: Array<{
  grade: PluginGrade;
  rangeKey: 'rangeA' | 'rangeB' | 'rangeC' | 'rangeD';
  descKey: 'excellent' | 'good' | 'fair' | 'poor';
}> = [
  { grade: 'A', rangeKey: 'rangeA', descKey: 'excellent' },
  { grade: 'B', rangeKey: 'rangeB', descKey: 'good' },
  { grade: 'C', rangeKey: 'rangeC', descKey: 'fair' },
  { grade: 'D', rangeKey: 'rangeD', descKey: 'poor' },
];

export function MethodContent() {
  const t = useTranslations('method');
  const ts = useTranslations('sponsor');

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-[var(--color-muted)]">
          {t('subtitle')}
        </p>
      </div>

      {/* MethodologyCards — 4 维度卡 */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dimensionConfig.map(({ key, Icon, color }) => (
          <div
            key={key}
            className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition-colors duration-fast ease-standard hover:border-[var(--card-hover-border)]"
          >
            <Icon className="h-5 w-5" style={{ color }} aria-hidden="true" />
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
                {t(`cards.${key}.name`)}
              </h3>
              <span
                className="tabular-nums text-sm font-bold"
                style={{ color }}
              >
                {t(`cards.${key}.weight`)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              {t(`cards.${key}.description`)}
            </p>
          </div>
        ))}
      </section>

      {/* WeightTable */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-[var(--color-text)]">
          {t('weightTable.title')}
        </h2>
        <div className="overflow-hidden rounded-[var(--table-radius)] border border-[var(--table-border)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('weightTable.dimension')}</TableHead>
                <TableHead>{t('weightTable.weight')}</TableHead>
                <TableHead>{t('weightTable.source')}</TableHead>
                <TableHead>{t('weightTable.scoring')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weightTableRows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium text-[var(--color-text)]">
                    {t(`cards.${row.key}.name`)}
                  </TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-3)]">
                        <div
                          className="h-full rounded-[var(--radius-full)] bg-[var(--color-primary)]"
                          style={{ width: `${row.weight}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-sm font-medium text-[var(--color-text-2)]">
                        {row.weight}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-muted)]">
                    {t(`weightTable.rows.${row.key}.source`)}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-muted)]">
                    {t(`weightTable.rows.${row.key}.scoring`)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* GradeLegend */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-[var(--color-text)]">
          {t('gradeLegend.title')}
        </h2>
        <div className="overflow-hidden rounded-[var(--table-radius)] border border-[var(--table-border)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24">Grade</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradeLegendRows.map((row) => (
                <TableRow key={row.grade}>
                  <TableCell>
                    <GradeBadge grade={row.grade} />
                  </TableCell>
                  <TableCell className="tabular-nums text-sm font-medium text-[var(--color-text-2)]">
                    {t(`gradeLegend.${row.rangeKey}`)}
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-muted)]">
                    {t(`gradeLegend.${row.descKey}`)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* 危险脚本规则 */}
      <section className="mb-10 rounded-[var(--card-radius)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-5">
        <h2 className="text-base font-semibold tracking-tight text-[var(--color-danger)]">
          {t('dangerRule.title')}
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-text-2)]">
          {t('dangerRule.body')}
        </p>
        <p className="mt-3 font-mono text-xs text-[var(--color-danger)]">
          {t('dangerRule.patterns')}
        </p>
      </section>

      {/* 透明性 */}
      <section className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
        <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
          {t('transparency.title')}
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-muted)]">
          {t('transparency.body')}
        </p>
      </section>

      {/* 广告政策（v0.4 商业化透明声明） */}
      <section className="mt-6 rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5">
        <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
          {ts('policy')}
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-muted)]">
          {ts('transparency')}
        </p>
      </section>
    </div>
  );
}
