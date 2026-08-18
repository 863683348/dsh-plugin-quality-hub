'use client';

import { useTranslations } from 'next-intl';

interface LegalSection {
  title: string;
  body: string;
}

interface LegalPageContentProps {
  ns: 'privacy' | 'terms';
}

export function LegalPageContent({ ns }: LegalPageContentProps) {
  const t = useTranslations(`legal.${ns}`);
  const sections = t.raw('sections') as LegalSection[];

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {t('title')}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-meta)]">{t('updated')}</p>
        <p className="mt-6 max-w-prose text-base leading-relaxed text-[var(--color-text-2)]">
          {t('intro')}
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
                {section.title}
              </h2>
              <p className="mt-2 max-w-prose text-base leading-relaxed text-[var(--color-text-2)]">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
