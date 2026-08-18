'use client';

import { ExternalLink, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ContactContent() {
  const t = useTranslations('legal.contact');

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-[var(--color-muted)]">
          {t('subtitle')}
        </p>

        <div className="mt-10 space-y-6">
          {/* 邮箱联系 */}
          <section className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <div className="flex items-center gap-2">
              <Mail
                className="h-5 w-5 text-[var(--color-primary)]"
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
                {t('email')}
              </h2>
            </div>
            <a
              href="mailto:ahmedlzany423@gmail.com"
              className="mt-3 inline-block text-base font-medium text-[var(--color-primary)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:shadow-focus rounded-[var(--radius-sm)]"
            >
              ahmedlzany423@gmail.com
            </a>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-text-2)]">
              {t('emailBody')}
            </p>
          </section>

          {/* GitHub */}
          <section className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-[var(--color-primary)]"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
                {t('github')}
              </h2>
            </div>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-text-2)]">
              {t('githubBody')}
            </p>
            <a
              href="https://github.com/863683348/dsh-plugin-quality-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-primary)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:shadow-focus"
            >
              {t('githubLink')}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </section>

          {/* 建议附上的信息 */}
          <section className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
              {t('response')}
            </h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-text-2)]">
              {t('responseBody')}
            </p>
          </section>

          {/* 隐私说明 */}
          <section className="rounded-[var(--card-radius)] border border-[var(--color-info)] bg-[var(--color-info-soft)] p-5">
            <p className="max-w-prose text-sm leading-relaxed text-[var(--color-text-2)]">
              {t('privacyNote')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
