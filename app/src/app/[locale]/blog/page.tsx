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
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    // FAQPage schema 为博客列表页增强 SEO，命中"how to check dsh plugin security"等长尾问句
    other: {
      'application/ld+json': JSON.stringify([
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How do I check if a DSH plugin is safe to install?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Check the plugin grade on dshquality.com before installing. A and B grades are generally safe; C requires extra scrutiny; D should be avoided unless necessary. Also check security warnings for dangerous install scripts.',
              },
            },
            {
              '@type': 'Question',
              name: 'What does the DSH Quality Score measure?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The DSH Quality Score evaluates plugins across four dimensions: maintenance activity (28%), documentation quality (28%), npm ecosystem health (24%), and security posture (20%). Scores range from 0-100, mapped to grades A (90-100), B (75-89), C (60-74), and D (<60).',
              },
            },
            {
              '@type': 'Question',
              name: 'What is a dangerous install script?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'A dangerous install script is a postinstall or preinstall hook that executes potentially harmful code — such as curl|sh, base64 decoding remote content, or accessing sensitive files. Plugins flagged with dangerous install scripts receive a D grade and should be avoided.',
              },
            },
          ],
        },
      ]),
    },
  };
}
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  setRequestLocale(params.locale);
  return <BlogContent />;
}
