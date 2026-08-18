'use client';

import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { ScoreBar } from '@/components/score-bar';
import type { ScoreBreakdown as ScoreBreakdownData } from '@/types/api';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownData;
}

const dimensionColors = {
  maintenance: 'var(--color-primary)',
  docs: 'var(--color-info)',
  npm: 'var(--color-success)',
  ecosystem: 'var(--color-warning)',
};

/**
 * 四维度评分拆解 — 每行：维度名 + 得分/满分 + 水平条 + 扣分原因
 * 颜色：维护 primary / 文档 info / npm success / 生态 warning
 */
export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const t = useTranslations('plugin.scoreBreakdown');

  const dims: Array<{
    key: 'maintenance' | 'docs' | 'npm' | 'ecosystem';
  }> = [
    { key: 'maintenance' },
    { key: 'docs' },
    { key: 'npm' },
    { key: 'ecosystem' },
  ];

  return (
    <div>
      <div className="space-y-5">
        {dims.map(({ key }) => {
          const dim = breakdown[key];
          const reasons = breakdown.details?.[key] ?? [];
          return (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {t(key)}
                </span>
                <span className="tabular-nums text-sm font-medium text-[var(--color-text-2)]">
                  {dim.score}
                  <span className="text-[var(--color-meta)]">/{dim.max}</span>
                </span>
              </div>
              <ScoreBar
                score={dim.score}
                max={dim.max}
                size="lg"
                showValue={false}
                color={dimensionColors[key]}
              />
              {reasons.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {reasons.map((reason, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-sm text-[var(--color-muted)]"
                    >
                      <Info
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-meta)]"
                        aria-hidden="true"
                      />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-6 border-t border-[var(--color-border)] pt-4">
        <p className="label-caps text-[var(--color-meta)]">
          {t('weightNote')}
        </p>
      </div>
    </div>
  );
}
