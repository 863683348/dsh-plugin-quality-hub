'use client';

import { Archive, Clock, GitBranch } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatDate, formatRelativeTime } from '@/lib/format';
import type { Plugin } from '@/types/api';

interface MetaInfoProps {
  plugin: Plugin;
}

/**
 * 元信息 — 作者 / 仓库 / 最后推送 / 归档状态（GitBranch / Clock / Archive）
 */
export function MetaInfo({ plugin }: MetaInfoProps) {
  const t = useTranslations('plugin.meta');
  const locale = useLocale() as 'en' | 'zh';

  const rows: Array<{ icon: typeof GitBranch; label: string; value: string; title?: string }> = [
    {
      icon: GitBranch,
      label: t('author'),
      value: plugin.owner,
    },
    {
      icon: GitBranch,
      label: t('repository'),
      value: plugin.repoName,
    },
    {
      icon: Clock,
      label: t('lastPush'),
      value: formatRelativeTime(plugin.lastPush, locale),
      title: formatDate(plugin.lastPush),
    },
    {
      icon: Archive,
      label: t('archived'),
      value: plugin.archived
        ? t('archived')
        : t('notArchived'),
    },
  ];

  return (
    <dl className="space-y-3">
      {rows.map((row, i) => {
        const Icon = row.icon;
        return (
          <div key={i} className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <Icon className="h-4 w-4 text-[var(--color-meta)]" aria-hidden="true" />
              {row.label}
            </dt>
            <dd
              className="truncate text-sm font-medium text-[var(--color-text-2)]"
              title={row.title}
            >
              {row.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
