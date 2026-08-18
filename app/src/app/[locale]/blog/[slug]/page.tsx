import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, CalendarDays, ArrowLeft } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getBlogPost, getBlogPosts, postPlainText, type BlogBlock } from '@/data/blog/posts';
import { formatBlogDate } from '@/lib/blog-format';

interface BlogPostPageProps {
  params: { locale: string; slug: string };
}

function formatDateFor(iso: string, locale: string): string {
  // 展示格式：en → "August 18, 2026"；zh → "2026 年 8 月 18 日"
  return formatBlogDate(iso, locale);
}

export function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.flatMap((p) => [
    { locale: 'en', slug: p.slug },
    { locale: 'zh', slug: p.slug },
  ]);
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? `/blog/${slug}` : `/${locale}/blog/${slug}`;
  const l = locale === 'en' ? post.en : post.zh;
  return {
    title: `${l.title} | DSH Quality`,
    description: l.metaDescription,
    keywords: [...post.keywords, ...post.longTail],
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/blog/${slug}`,
        zh: `${siteUrl}/zh/blog/${slug}`,
      },
    },
    openGraph: {
      title: l.title,
      description: l.excerpt,
      url: `${siteUrl}${path}`,
      type: 'article',
      publishedTime: post.date,
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      siteName: 'DSH Quality',
    },
  };
}

function Block({ block }: { block: BlogBlock }) {
  if (block.h2) return <h2 className="mt-10 text-xl font-bold tracking-tight text-[var(--color-text)]">{block.h2}</h2>;
  if (block.h3) return <h3 className="mt-6 text-lg font-semibold tracking-tight text-[var(--color-text)]">{block.h3}</h3>;
  if (block.p) return <p className="mt-4 max-w-prose text-base leading-relaxed text-[var(--color-text-2)]">{block.p}</p>;
  if (block.blockquote)
    return (
      <blockquote className="mt-4 border-l-2 border-[var(--color-primary)] pl-4 text-base italic text-[var(--color-muted)]">
        {block.blockquote}
      </blockquote>
    );
  if (block.ul)
    return (
      <ul className="mt-4 max-w-prose list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--color-text-2)]">
        {block.ul.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  if (block.table)
    return (
      <div className="mt-4 overflow-x-auto rounded-[var(--card-radius)] border border-[var(--card-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--color-surface-2)] text-left text-[var(--color-muted)]">
              {block.table.head.map((h, i) => (
                <th key={i} className="px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.table.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-[var(--card-border)] last:border-0">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-[var(--color-text-2)]">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return null;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = params;
  setRequestLocale(locale);
  const t = await getTranslations('legal.blog');
  const post = getBlogPost(slug);
  if (!post) notFound();

  const l = locale === 'en' ? post.en : post.zh;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? `/blog/${slug}` : `/${locale}/blog/${slug}`;
  const dateDisplay = formatDateFor(post.date, locale);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: l.title,
    description: l.metaDescription,
    datePublished: post.date,
    inLanguage: locale,
    mainEntityOfPage: `${siteUrl}${path}`,
    keywords: [...post.keywords, ...post.longTail].join(', '),
    publisher: { '@type': 'Organization', name: 'DSH Quality', url: siteUrl },
    articleBody: postPlainText(post, locale as 'en' | 'zh'),
  };

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <div className="mx-auto max-w-3xl">
        {/* 面包屑 */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
          <Link href="/" className="rounded-[var(--radius-sm)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)]">
            {t('breadcrumb.home')}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--color-meta)]" aria-hidden="true" />
          <Link href="/blog" className="rounded-[var(--radius-sm)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)]">
            {t('title')}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-[var(--color-meta)]" aria-hidden="true" />
          <span className="truncate font-medium text-[var(--color-text-2)]">{l.title}</span>
        </nav>

        {/* 标题区 */}
        <header>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--color-text)]">{l.title}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-meta)]">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <time dateTime={post.date}>{dateDisplay}</time>
          </div>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-[var(--color-muted)]">{l.excerpt}</p>
        </header>

        {/* 正文 */}
        <article className="mt-2">
          {l.body.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </article>

        {/* 长尾词标签 */}
        <div className="mt-10 flex flex-wrap gap-2 border-t border-[var(--card-border)] pt-6">
          {[...post.keywords, ...post.longTail].map((kw) => (
            <span key={kw} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs text-[var(--color-muted)]">
              {kw}
            </span>
          ))}
        </div>

        {/* 返回列表 */}
        <div className="mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors duration-fast ease-standard hover:text-[var(--color-text)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('backToList')}
          </Link>
        </div>
      </div>
    </div>
  );
}
