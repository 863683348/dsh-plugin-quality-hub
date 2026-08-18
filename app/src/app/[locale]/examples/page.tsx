import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPublishedExamples } from '@/lib/content-service';
import { ExampleCard } from '@/components/example-card';

interface ExamplesPageProps {
  params: { locale: string };
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: ExamplesPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'examples.meta' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/examples' : `/${locale}/examples`;
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/examples`,
        zh: `${siteUrl}/zh/examples`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${siteUrl}${path}`,
      siteName: 'DSH Plugin Quality Hub',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
  };
}

export default async function ExamplesPage({ params }: ExamplesPageProps) {
  setRequestLocale(params.locale);
  const locale = params.locale as 'en' | 'zh';
  const t = await getTranslations('examples');

  const examples = await getPublishedExamples();

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <header className="mb-10 max-w-2xl">
        <p className="label-caps text-[var(--color-primary)]">
          {t('section.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {t('section.title')}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">
          {t('section.subtitle')}
        </p>
      </header>

      {examples.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{t('notFound.body')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((example) => (
            <ExampleCard
              key={example.slug}
              example={example}
              locale={locale}
              categoryLabel={t(`category.${example.category}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
