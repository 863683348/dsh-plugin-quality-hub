import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { BlogContent } from '@/components/blog-content';

interface BlogPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/blog' : `/${locale}/blog`;
  const title =
    locale === 'zh'
      ? 'DSH Quality 博客——插件生态分析与安全发现'
      : 'DSH Quality Blog — Plugin Ecosystem Analysis & Security Findings';
  const description =
    locale === 'zh'
      ? '关于 DSH 插件生态的观察：生态分析、评分深读，以及 DSH Quality 团队的安全发现。'
      : 'Notes on the DSH plugin ecosystem: analysis, scoring deep dives, and security findings from the DSH Quality team.';
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/blog`,
        zh: `${siteUrl}/zh/blog`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${path}`,
      siteName: 'DSH Quality',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  setRequestLocale(params.locale);
  return <BlogContent />;
}
