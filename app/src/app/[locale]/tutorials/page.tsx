import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPublishedTutorials } from '@/lib/content-service';
import { TutorialCard } from '@/components/tutorial-card';
import type { TutorialLevel } from '@/types/content';

interface TutorialsPageProps {
  params: { locale: string };
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: TutorialsPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'tutorials.meta' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/tutorials' : `/${locale}/tutorials`;
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/tutorials`,
        zh: `${siteUrl}/zh/tutorials`,
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

export default async function TutorialsPage({ params }: TutorialsPageProps) {
  setRequestLocale(params.locale);
  const locale = params.locale as 'en' | 'zh';
  const t = await getTranslations('tutorials');

  const tutorials = await getPublishedTutorials();
  const levels: TutorialLevel[] = ['beginner', 'intermediate', 'advanced'];
  const groups = levels
    .map((level) => ({
      level,
      items: tutorials.filter((x) => x.level === level),
    }))
    .filter((g) => g.items.length > 0);

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

      {groups.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{t('notFound.body')}</p>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.level}>
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--color-text)]">
                {t(`level.${group.level}`)}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((tutorial) => (
                  <TutorialCard
                    key={tutorial.slug}
                    tutorial={tutorial}
                    locale={locale}
                    levelLabel={t(`level.${tutorial.level as TutorialLevel}`)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
