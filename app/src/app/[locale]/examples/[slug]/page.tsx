import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowUpRight, ChevronLeft } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  getExampleBySlug,
  getPublishedExamples,
  getRelatedTutorials,
  getRelatedPlugins,
} from '@/lib/content-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownContent } from '@/components/markdown-content';
import { RelatedTutorials } from '@/components/related-tutorials';
import { RelatedPlugins } from '@/components/related-plugins';

interface ExampleDetailPageProps {
  params: { locale: string; slug: string };
}

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const examples = await getPublishedExamples();
    return examples.map((e) => ({ slug: e.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ExampleDetailPageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const example = await getExampleBySlug(slug).catch(() => null);
  const fallback = await getTranslations({
    locale,
    namespace: 'examples.notFound',
  });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path =
    locale === 'en' ? `/examples/${slug}` : `/${locale}/examples/${slug}`;
  const isZh = locale === 'zh';
  const title = example
    ? isZh
      ? example.titleZh
      : example.titleEn
    : fallback('title');
  const description = example
    ? isZh
      ? example.excerptZh
      : example.excerptEn
    : fallback('body');

  return {
    title: `${title} | DSH Quality`,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/examples/${slug}`,
        zh: `${siteUrl}/zh/examples/${slug}`,
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

export default async function ExampleDetailPage({
  params,
}: ExampleDetailPageProps) {
  setRequestLocale(params.locale);
  const locale = params.locale as 'en' | 'zh';
  const t = await getTranslations('examples');

  const example = await getExampleBySlug(params.slug);
  if (!example) notFound();

  const isZh = locale === 'zh';
  const [relatedTutorials, relatedPlugins] = await Promise.all([
    getRelatedTutorials(example.relatedTutorialSlugs),
    getRelatedPlugins([example.pluginName]),
  ]);

  const dims = [
    { key: 'config', content: isZh ? example.configZh : example.configEn },
    { key: 'code', content: isZh ? example.codeZh : example.codeEn },
    {
      key: 'highlights',
      content: isZh ? example.highlightsZh : example.highlightsEn,
    },
  ];

  return (
    <article className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/examples"
          className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] text-sm text-[var(--color-muted)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToList')}
        </Link>
      </nav>

      <header className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{t(`category.${example.category}`)}</Badge>
          <span className="font-mono text-sm text-[var(--color-meta)]">
            {example.pluginName}
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {isZh ? example.titleZh : example.titleEn}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">
          {isZh ? example.excerptZh : example.excerptEn}
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0 space-y-6">
          {dims.map((dim) => (
            <Card key={dim.key}>
              <CardHeader>
                <CardTitle className="text-base">
                  {t(`dims.${dim.key}`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownContent content={dim.content} />
              </CardContent>
            </Card>
          ))}
        </div>

        <aside className="space-y-6">
          <Button asChild variant="secondary" className="w-full">
            <Link href={`/plugin/${encodeURIComponent(example.pluginName)}`}>
              {t('viewOnHub')}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <RelatedTutorials
            tutorials={relatedTutorials}
            locale={locale}
            title={t('relatedTutorials')}
          />
          <RelatedPlugins
            plugins={relatedPlugins}
            title={t('plugin')}
            viewOnHubLabel={t('viewOnHub')}
          />
        </aside>
      </div>
    </article>
  );
}
