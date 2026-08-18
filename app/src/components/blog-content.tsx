'use client';

import { ArrowRight, CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getBlogPosts } from '@/data/blog/posts';
import { formatBlogDate } from '@/lib/blog-format';

export function BlogContent() {
  const t = useTranslations('legal.blog');
  const locale = useLocale();
  const posts = getBlogPosts();

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
          {posts.map((post) => {
            const l = locale === 'en' ? post.en : post.zh;
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition-colors duration-fast ease-standard hover:border-[var(--card-hover-border)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
                    {l.title}
                  </h2>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-all duration-fast ease-standard group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-meta)]">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatBlogDate(post.date, locale)}
                </p>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-text-2)]">
                  {l.excerpt}
                </p>
              </Link>
            );
          })}
        </div>

        <p className="mt-8 rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
          {t('comingSoon')}
        </p>
      </div>
    </div>
  );
}
