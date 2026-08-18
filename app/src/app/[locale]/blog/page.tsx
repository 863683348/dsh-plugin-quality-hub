import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BlogContent } from '@/components/blog-content';

interface BlogPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'legal.blog' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/blog' : `/${locale}/blog`;
  return {
    title: t('title'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/blog`,
        zh: `${siteUrl}/zh/blog`,
      },
    },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  setRequestLocale(params.locale);
  return <BlogContent />;
}
