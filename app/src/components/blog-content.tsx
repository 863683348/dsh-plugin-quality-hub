'use client';

import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BlogPost {
  title: string;
  date: string;
  excerpt: string;
}

export function BlogContent() {
  const t = useTranslations('legal.blog');
  const posts = t.raw('posts') as BlogPost[];

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
          {posts.map((post, index) => (
            <article
              key={index}
              className="group rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition-colors duration-fast ease-standard hover:border-[var(--card-hover-border)]"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
                  {post.title}
                </h2>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-colors duration-fast ease-standard group-hover:text-[var(--color-primary)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--color-meta)]">{post.date}</p>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-text-2)]">
                {post.excerpt}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-8 rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
          {t('comingSoon')}
        </p>
      </div>
    </div>
  );
}
