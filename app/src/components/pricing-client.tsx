'use client';

// ============================================================
// PricingClient — /pricing 页客户端部分
// 月/年切换 + 升级按钮 (调 /api/v1/waffo/checkout)
// 免费卡纯展示; Pro 卡根据年/月调对应 plan
// ============================================================

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Check, Crown, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export function PricingClient() {
  const t = useTranslations('pricing');
  const tn = useTranslations('membership.nav');
  const [yearly, setYearly] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkout = async (plan: 'pro_monthly' | 'pro_yearly') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/waffo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const body = (await res.json()) as { code: number; data?: { checkoutUrl?: string }; message?: string };
      if (res.ok && body.code === 0 && body.data?.checkoutUrl) {
        window.location.href = body.data.checkoutUrl;
        return;
      }
      setError(body.message || 'Checkout failed. Please try again.');
    } catch {
      setError('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goUpgrade = () => {
    if (yearly) checkout('pro_yearly');
    else checkout('pro_monthly');
  };

  const freeFeatures = t.raw('free.features') as string[];
  const proFeatures = t.raw('pro.features') as string[];
  const rows = t.raw('comparison.rows') as { label: string; free: string; pro: string }[];
  const faqs = t.raw('faq.items') as { q: string; a: string }[];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
          <Crown className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden="true" />
          {t('hero.badge')}
        </span>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-[var(--color-text)]">
          {t('hero.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]">
          {t('hero.subtitle')}
        </p>
      </div>

      {/* 计费切换 */}
      <div className="mt-10 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setYearly(false)}
          className={cn(
            'rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:shadow-focus',
            !yearly
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-on)]'
              : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
          )}
        >
          {t('billing.monthly')}
        </button>
        <button
          type="button"
          onClick={() => setYearly(true)}
          className={cn(
            'inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:shadow-focus',
            yearly
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-on)]'
              : 'bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
          )}
        >
          {t('billing.yearly')}
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold',
              yearly
                ? 'bg-[var(--color-primary-on)]/20 text-[var(--color-primary-on)]'
                : 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
            )}
          >
            {t('billing.save')}
          </span>
        </button>
      </div>

      {/* 卡片 */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7">
          <h2 className="text-base font-semibold text-[var(--color-text)]">{t('free.name')}</h2>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-[var(--color-text)]">{t('free.price')}</span>
            <span className="text-sm text-[var(--color-muted)]">{t('free.period')}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{t('free.description')}</p>
          <ul className="mt-6 space-y-2.5">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-text-2)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-7">
            <Link
              href="/"
              className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:shadow-focus"
            >
              {t('free.cta')}
            </Link>
          </div>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col rounded-[var(--radius-lg)] border-2 border-[var(--color-primary)] bg-[var(--color-surface)] p-7 shadow-lg shadow-[var(--color-primary)]/10">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary-on)]">
            {tn('pro')}
          </span>
          <h2 className="text-base font-semibold text-[var(--color-text)]">{t('pro.name')}</h2>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-[var(--color-text)]">
              {yearly ? t('pro.priceYearly') : t('pro.priceMonthly')}
            </span>
            <span className="text-sm text-[var(--color-muted)]">
              {yearly ? t('pro.periodYearly') : t('pro.period')}
            </span>
            {yearly && (
              <span className="text-sm text-[var(--color-meta)] line-through">
                {t('pro.priceYearlyOld')}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{t('pro.description')}</p>
          <ul className="mt-6 space-y-2.5">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-text-2)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-7">
            <button
              type="button"
              disabled={loading}
              onClick={goUpgrade}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-on)] transition-colors duration-fast ease-standard hover:opacity-90 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('pro.cta')}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-[var(--color-danger)]">{error}</p>
      )}
      <p className="mt-3 text-center text-xs text-[var(--color-meta)]">
        {t('note.taxes')} {t('note.cancel')}
      </p>

      {/* 对比表 */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--color-text)]">
          {t('comparison.title')}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--color-muted)]">
          {t('comparison.subtitle')}
        </p>
        <div className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <th className="px-4 py-3 text-left font-semibold text-[var(--color-text)]">{t('free.name')}</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--color-text)]">{t('pro.name')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={cn('border-b border-[var(--color-border)] last:border-0', i % 2 === 1 && 'bg-[var(--color-surface-2)]/50')}>
                  <td className="px-4 py-3 text-[var(--color-text-2)]">{row.label}</td>
                  <td className="px-4 py-3 text-center font-medium text-[var(--color-muted)]">{row.free}</td>
                  <td className="px-4 py-3 text-center font-semibold text-[var(--color-primary)]">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--color-text)]">
          {t('faq.title')}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--color-muted)]">
          {t('faq.subtitle')}
        </p>
        <div className="mx-auto mt-6 max-w-2xl space-y-3">
          {faqs.map((item, i) => (
            <details
              key={i}
              className="group rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--color-text)] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="text-[var(--color-muted)] transition-transform duration-fast ease-standard group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mt-16 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-10 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">{t('bottom.title')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">{t('bottom.body')}</p>
        <button
          type="button"
          disabled={loading}
          onClick={goUpgrade}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-7 text-sm font-semibold text-[var(--color-primary-on)] transition-colors duration-fast ease-standard hover:opacity-90 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t('bottom.cta')}
        </button>
      </section>
    </div>
  );
}
