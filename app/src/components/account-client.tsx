'use client';

// ============================================================
// AccountClient — /account 会员账户页
// 调 /api/v1/me 拉用户+订阅状态; 未登录跳 /login
// 已订阅: 显示 plan/status + 管理订阅 (subscriptionManagementUrl)
// 未订阅: 显示升级 CTA; 退出登录按钮
// ============================================================

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Loader2, LogOut } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface MeData {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  tier: string;
  isPro: boolean;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd?: string | null;
    managementUrl?: string | null;
  } | null;
}

export function AccountClient() {
  const t = useTranslations('membership.account');
  const [loading, setLoading] = React.useState(true);
  const [anon, setAnon] = React.useState(false);
  const [me, setMe] = React.useState<MeData | null>(null);
  const [canceling, setCanceling] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/me', { cache: 'no-store' });
        if (res.status === 401) {
          if (!cancelled) setAnon(true);
          return;
        }
        const body = (await res.json()) as { code: number; data?: MeData };
        if (!cancelled) {
          if (res.ok && body.code === 0 && body.data) {
            setMe(body.data);
          } else {
            setAnon(true);
          }
        }
      } catch {
        if (!cancelled) setAnon(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onCancel = async () => {
    setCanceling(true);
    setCancelError(null);
    try {
      const res = await fetch('/api/v1/waffo/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body = (await res.json()) as { code: number; message?: string };
      if (res.ok && body.code === 0) {
        // 刷新订阅状态
        const meRes = await fetch('/api/v1/me', { cache: 'no-store' });
        const meBody = (await meRes.json()) as { code: number; data?: MeData };
        if (meRes.ok && meBody.code === 0 && meBody.data) setMe(meBody.data);
      } else {
        setCancelError(body.message || t('cancelError'));
      }
    } catch {
      setCancelError(t('cancelError'));
    } finally {
      setCanceling(false);
    }
  };

  const onLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" aria-hidden="true" />
        <p className="mt-3 text-sm text-[var(--color-muted)]">{t('loading')}</p>
      </div>
    );
  }

  if (anon) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
          {t('title')}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
          {t('signInFirst')}
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-semibold text-[var(--color-primary-on)] transition-colors duration-fast ease-standard hover:opacity-90 focus-visible:outline-none focus-visible:shadow-focus"
          >
            {t('signInCta')}
          </Link>
        </div>
      </div>
    );
  }

  const user = me?.user;
  const sub = me?.subscription;
  const isPro = me?.isPro;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
        {t('title')}
      </h1>

      {/* 用户信息 */}
      <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-lg font-bold text-[var(--color-primary)]">
            {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[var(--color-meta)] text-xs">{t('signedInAs')}</p>
          <p className="truncate text-base font-semibold text-[var(--color-text)]">
            {user?.name || user?.email || '—'}
          </p>
          {user?.email && user?.name && (
            <p className="truncate text-sm text-[var(--color-muted)]">{user.email}</p>
          )}
        </div>
      </div>

      {/* 订阅状态 */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--color-meta)]">{t('plan')}</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-bold text-[var(--color-text)]">
              {isPro ? (
                <>
                  <Crown className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
                  {t('planPro')}
                </>
              ) : (
                t('planFree')
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--color-meta)]">{t('status')}</p>
            <p
              className={
                'mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                (isPro
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]')
              }
            >
              {isPro ? t('statusActive') : t('statusNone')}
            </p>
          </div>
        </div>

        {sub?.currentPeriodEnd && (
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            {t('renewsOn')} {new Date(sub.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-5">
          {isPro && sub?.managementUrl ? (
            <a
              href={sub.managementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-on)] transition-colors duration-fast ease-standard hover:opacity-90 focus-visible:outline-none focus-visible:shadow-focus"
            >
              {t('renew')}
            </a>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-on)] transition-colors duration-fast ease-standard hover:opacity-90 focus-visible:outline-none focus-visible:shadow-focus"
            >
              {t('upgrade')}
            </Link>
          )}

          {isPro && (
            <button
              type="button"
              disabled={canceling}
              onClick={onCancel}
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 text-sm font-medium text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60"
            >
              {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('cancel')}
            </button>
          )}
        </div>

        {isPro && !cancelError && (
          <p className="mt-3 text-xs text-[var(--color-meta)]">{t('cancelNote')}</p>
        )}
        {cancelError && (
          <p className="mt-3 text-xs text-[var(--color-danger)]">{cancelError}</p>
        )}
      </div>

      {/* 退出登录 */}
      <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-sm text-[var(--color-muted)]">{t('logoutNote')}</p>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 text-sm font-medium text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:shadow-focus"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('logout')}
        </button>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="text-xs font-medium text-[var(--color-muted)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus rounded-[var(--radius-sm)]"
        >
          ← {t('back')}
        </Link>
      </div>
    </div>
  );
}
