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

  const faqsEn = [
    {
      q: 'What is a DSH plugin?',
      a: 'A DSH (DeepSeek Harness) plugin extends the harness with new tools, commands, or MCP integrations. It is declared through a dsh.bundle field in the plugin’s package.json.',
    },
    {
      q: 'How do I install a DSH plugin safely?',
      a: 'Install only A- and B-grade plugins listed on the Hub, review the install script for any remote-code execution, and run in a sandboxed or local environment first.',
    },
    {
      q: 'Do I need coding experience to build a DSH plugin?',
      a: 'No. The beginner tutorial walks you through writing your first apply(ctx, config) without requiring deep prior experience.',
    },
    {
      q: 'How do I publish a DSH plugin?',
      a: 'Package your plugin, add a dsh.bundle declaration, push it to the dsh-plugin topic, and submit it for independent quality scoring.',
    },
  ];
  const faqsZh = [
    {
      q: '什么是 DSH 插件？',
      a: 'DSH（DeepSeek Harness）插件通过新工具、命令或 MCP 集成来扩展 harness，在插件的 package.json 中以 dsh.bundle 字段声明。',
    },
    {
      q: '如何安全地安装 DSH 插件？',
      a: '只安装 Hub 上 A、B 级的插件，检查安装脚本是否存在远程代码执行，并先在沙箱或本地环境试运行。',
    },
    {
      q: '做 DSH 插件需要编程经验吗？',
      a: '不需要。新手教程会带你写出第一个 apply(ctx, config)，无需深厚基础。',
    },
    {
      q: '如何发布 DSH 插件？',
      a: '打包插件、添加 dsh.bundle 声明、推送到 dsh-plugin topic，再提交做独立质量评分。',
    },
  ];
  const faqs = locale === 'zh' ? faqsZh : faqsEn;
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

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

      <section className="mt-14 max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-[var(--color-text)]">
          {locale === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
        </h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-panel)] p-4"
            >
              <summary className="cursor-pointer font-semibold text-[var(--color-text)]">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
