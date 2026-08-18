'use client';

// ============================================================
// AccountStatus — header 用户状态按钮
// 调 /api/v1/me 判断登录态:
//   - 未登录: "Sign in" 按钮 → /login
//   - 已登录 free: 用户名 + "Pro" 升级按钮
//   - 已登录 pro: "Pro" 徽章 + 账户链接
// 404/401 视为未登录静默降级
// ============================================================

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Crown, User } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface MeData {
  isPro: boolean;
  user?: { name?: string | null; email?: string | null };
}

export function AccountStatus() {
  const t = useTranslations('membership.nav');
  const [state, setState] = React.useState<'loading' | 'anon' | 'member'>(
    'loading'
  );
  const [isPro, setIsPro] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/me', { cache: 'no-store' });
        if (!res.ok || res.status === 401) {
          if (!cancelled) setState('anon');
          return;
        }
        const me = (await res.json()) as { code: number; data?: MeData };
        if (!cancelled) {
          if (res.ok && me.code === 0 && me.data) {
            setIsPro(!!me.data.isPro);
            setState('member');
          } else {
            setState('anon');
          }
        }
      } catch {
        if (!cancelled) setState('anon');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="h-9 w-20 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" />
    );
  }

  if (state === 'anon') {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:shadow-focus"
      >
        <User className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {t('login')}
      </Link>
    );
  }

  // 已登录
  return (
    <div className="flex items-center gap-1.5">
      {!isPro && (
        <Link
          href="/pricing"
          className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 text-xs font-semibold text-[var(--color-primary-on)] transition-colors duration-fast ease-standard hover:opacity-90 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <Crown className="h-3.5 w-3.5" aria-hidden="true" />
          {t('upgrade')}
        </Link>
      )}
      <Link
        href="/account"
        title={t('account')}
        aria-label={t('account')}
        className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:shadow-focus"
      >
        {isPro ? (
          <Crown className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
        ) : (
          <User className="h-4 w-4" aria-hidden="true" />
        )}
      </Link>
    </div>
  );
}
