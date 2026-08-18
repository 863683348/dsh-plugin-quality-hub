'use client';

import { ExternalLink, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

const sections = ['why', 'what', 'data'] as const;

export function AboutContent() {
  const t = useTranslations('about');

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {t('title')}
        </h1>

        <div className="mt-8 space-y-8">
          {sections.map((key) => (
            <section key={key}>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                {t(`${key}.title`)}
              </h2>
              <p className="mt-2 max-w-prose text-base leading-relaxed text-[var(--color-text-2)]">
                {t(`${key}.body`)}
              </p>
            </section>
          ))}

          {/* 局限性声明卡 */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-info)] bg-[var(--color-info-soft)] p-5">
            <div className="flex items-start gap-3">
              <Info
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-info)]"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text)]">
                  {t('limitations.title')}
                </h2>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-text-2)]">
                  {t('limitations.body')}
                </p>
              </div>
            </div>
          </section>

          {/* 联系 */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
              {t('contact.title')}
            </h2>
            <p className="mt-2 max-w-prose text-base leading-relaxed text-[var(--color-text-2)]">
              {t('contact.body')}
            </p>
            <a
              href="https://github.com/863683348/dsh-plugin-quality-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-primary)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:shadow-focus"
            >
              {t('contact.link')}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
