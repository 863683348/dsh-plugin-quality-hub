'use client';

import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SecurityFlag } from '@/components/security-flag';
import type { SecurityFlag as SecurityFlagType } from '@/types/api';

interface SecurityFlagsProps {
  flags: SecurityFlagType[];
}

/**
 * 安全标记区 — 按严重度排序 danger → warning → info
 * 无标记时显示绿色 ShieldCheck
 */
export function SecurityFlags({ flags }: SecurityFlagsProps) {
  const t = useTranslations('plugin.flags');

  const sorted = [...flags].sort((a, b) => {
    const order = { danger: 0, warning: 1, info: 2 };
    return order[a.type] - order[b.type];
  });

  return (
    <div className="space-y-3">
      {sorted.length === 0 ? (
        <div className="flex items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--card-bg)] p-4">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {t('none')}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {t('noneDetail')}
            </p>
          </div>
        </div>
      ) : (
        sorted.map((flag, i) => (
          <div
            key={i}
            className={
              flag.type === 'danger'
                ? 'rounded-[var(--radius-lg)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-4'
                : 'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--card-bg)] p-4'
            }
          >
            <SecurityFlag
              type={flag.type}
              label={flag.label}
              detail={flag.detail}
              emphasized
            />
          </div>
        ))
      )}
    </div>
  );
}
