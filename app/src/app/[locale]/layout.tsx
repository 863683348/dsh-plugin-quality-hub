import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { Inter } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@/components/analytics';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  // en 为默认 locale，走裸路径；zh 带 /zh 前缀
  const pathFor = (l: string) => (l === 'en' ? '/' : `/${l}`);
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? '/' : `/${locale}`}`,
      languages: {
        en: `${siteUrl}${pathFor('en')}`,
        zh: `${siteUrl}${pathFor('zh')}`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${siteUrl}${locale === 'en' ? '/' : `/${locale}`}`,
      siteName: 'DSH Plugin Quality Hub',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DSH Plugin Quality Hub',
    url: siteUrl,
    description:
      'Independent ratings and security signals for the DeepSeek Harness (DSH) plugin ecosystem.',
  };
  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DSH Plugin Quality Hub',
    url: siteUrl,
    inLanguage: ['en', 'zh'],
  };

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* GA4 站点统计（next/script afterInteractive，不阻塞渲染；仅生产加载） */}
        <Analytics />
        {/* JSON-LD 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </head>
      <body className="flex min-h-[100dvh] flex-col bg-bg text-text">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
