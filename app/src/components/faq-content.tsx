'use client';

import { useTranslations } from 'next-intl';

interface FaqItem {
  q: string;
  a: string;
}

export function FaqContent() {
  const t = useTranslations('legal.faq');
  const items = t.raw('items') as FaqItem[];

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-[var(--color-muted)]">
          {t('subtitle')}
        </p>

        <div className="mt-10 space-y-4">
          {items.map((item, index) => (
            <details
              key={index}
              className="group rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition-colors duration-fast ease-standard hover:border-[var(--card-hover-border)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold tracking-tight text-[var(--color-text)]">
                {item.q}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[var(--color-muted)] transition-transform duration-fast ease-standard group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-text-2)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
