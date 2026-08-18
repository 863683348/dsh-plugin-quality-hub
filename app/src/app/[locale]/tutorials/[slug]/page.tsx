import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronLeft, Clock, Lock } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  getTutorialBySlug,
  getPublishedTutorials,
  getRelatedExamples,
  getRelatedPlugins,
} from '@/lib/content-service';
import { getTutorialBySlugGated } from '@/lib/content-gate';
import { MarkdownContent } from '@/components/markdown-content';
import { ProGatedContent } from '@/components/pro-gated-content';
import { LevelBadge } from '@/components/level-badge';
import { RelatedExamples } from '@/components/related-examples';
import { RelatedPlugins } from '@/components/related-plugins';
import type { TutorialLevel } from '@/types/content';

interface TutorialDetailPageProps {
  params: { locale: string; slug: string };
}

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const tutorials = await getPublishedTutorials();
    return tutorials.map((t) => ({ slug: t.slug }));
  } catch {
    // DB 不可达时不阻断构建，退回运行时动态渲染
    return [];
  }
}

export async function generateMetadata({
  params,
}: TutorialDetailPageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const tutorial = await getTutorialBySlug(slug).catch(() => null);
  const fallback = await getTranslations({
    locale,
    namespace: 'tutorials.notFound',
  });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path =
    locale === 'en' ? `/tutorials/${slug}` : `/${locale}/tutorials/${slug}`;
  const isZh = locale === 'zh';
  const title = tutorial
    ? isZh
      ? tutorial.titleZh
      : tutorial.titleEn
    : fallback('title');
  const description = tutorial
    ? isZh
      ? tutorial.excerptZh
      : tutorial.excerptEn
    : fallback('body');

  return {
    title: `${title} | DSH Quality`,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/tutorials/${slug}`,
        zh: `${siteUrl}/zh/tutorials/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${path}`,
      siteName: 'DSH Plugin Quality Hub',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'article',
    },
  };
}

export default async function TutorialDetailPage({
  params,
}: TutorialDetailPageProps) {
  setRequestLocale(params.locale);
  const locale = params.locale as 'en' | 'zh';
  const t = await getTranslations('tutorials');
  const tc = await getTranslations('common');

  const tutorial = await getTutorialBySlugGated(params.slug);
  if (!tutorial) notFound();

  const isZh = locale === 'zh';
  const [relatedExamples, relatedPlugins] = await Promise.all([
    getRelatedExamples(tutorial.relatedExampleSlugs),
    getRelatedPlugins(tutorial.relatedPluginNames),
  ]);

  return (
    <article className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/tutorials"
          className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] text-sm text-[var(--color-muted)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToList')}
        </Link>
      </nav>

      <header className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <LevelBadge
            level={tutorial.level as TutorialLevel}
            label={t(`level.${tutorial.level as TutorialLevel}`)}
          />
          <span className="flex items-center gap-1 text-sm text-[var(--color-meta)]">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {isZh
              ? `${tutorial.readingMinutes} 分钟阅读`
              : `${tutorial.readingMinutes} min read`}
          </span>
          {tutorial.locked ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-2)]">
              <Lock className="h-3 w-3 text-[var(--color-primary)]" aria-hidden="true" />
              Pro
            </span>
          ) : null}
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {isZh ? tutorial.titleZh : tutorial.titleEn}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">
          {isZh ? tutorial.excerptZh : tutorial.excerptEn}
        </p>
        {tutorial.publishedAt ? (
          <p className="mt-3 text-sm text-[var(--color-meta)]">
            {t('updated', {
              date: new Date(tutorial.publishedAt)
                .toISOString()
                .slice(0, 10),
            })}
          </p>
        ) : null}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0">
          <ProGatedContent
            type="tutorials"
            slug={tutorial.slug}
            locked={tutorial.locked}
            locale={locale}
          >
            <MarkdownContent
              content={isZh ? tutorial.contentZh : tutorial.contentEn}
            />
          </ProGatedContent>
        </div>
        <aside className="space-y-6">
          <RelatedExamples
            examples={relatedExamples}
            locale={locale}
            title={t('relatedExamples')}
          />
          <RelatedPlugins
            plugins={relatedPlugins}
            title={t('relatedPlugins')}
            viewOnHubLabel={tc('actions.viewOnGitHub')}
          />
        </aside>
      </div>
    </article>
  );
}
