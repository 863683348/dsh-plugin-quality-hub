import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, ExternalLink, Package, SearchX } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getPluginDetail, listPlugins } from '@/services/plugin-service';
import { mockData } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradeBadge } from '@/components/grade-badge';
import { ScoreBreakdown } from '@/components/score-breakdown';
import { SecurityFlags } from '@/components/security-flags';
import { MetaInfo } from '@/components/meta-info';
import { BadgeEmbed } from '@/components/badge-embed';
import { formatCompact } from '@/lib/format';
import type { PluginDetail } from '@/types/api';

/** 前端扩展字段（后端可选，缺省渲染 —） */
type DetailWithNpm = PluginDetail & {
  npmVersion?: string | null;
  npmDownloads?: number | null;
};

interface PluginPageProps {
  params: { locale: string; name: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PluginPageProps): Promise<Metadata> {
  let plugin: DetailWithNpm | null = null;
  try {
    plugin = (await getPluginDetail(params.name)) as DetailWithNpm | null;
  } catch {
    plugin = null;
  }
  const fallback = await getTranslations({
    locale: params.locale,
    namespace: 'meta',
  });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = params.locale === 'en' ? `/plugin/${params.name}` : `/${params.locale}/plugin/${params.name}`;
  return {
    title: plugin ? `${plugin.name} | DSH Quality` : fallback('title'),
    description: plugin?.description ?? fallback('description'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/plugin/${params.name}`,
        zh: `${siteUrl}/zh/plugin/${params.name}`,
      },
    },
  };
}

export default async function PluginPage({ params }: PluginPageProps) {
  setRequestLocale(params.locale);
  const t = await getTranslations('plugin');
  const tc = await getTranslations('common');

  // SSR 直接走 service 层（绕过 HTTP 自我请求超时回退 mock 的问题）
  let fetched: DetailWithNpm | null = null;
  try {
    fetched = (await getPluginDetail(params.name)) as DetailWithNpm | null;
  } catch {
    fetched = null;
  }
  const plugin = fetched ?? mockData.pluginDetail(params.name);

  if (!plugin) {
    notFound();
  }

  // Fetch similar plugins (same grade, high score, exclude current)
  let similarPlugins: { name: string; grade: 'A' | 'B' | 'C' | 'D'; score: number; description: string | null }[] = [];
  try {
    const result = await listPlugins({
      page: 1,
      limit: 5,
      grade: plugin.grade,
      sort: 'score',
      order: 'desc',
    });
    similarPlugins = result.items
      .filter(p => p.name !== plugin.name)
      .slice(0, 5)
      .map(p => ({ name: p.name, grade: p.grade, score: p.score, description: p.description }));
  } catch {
    // Ignore if similar plugins fetch fails
  }

  const [, repo] = plugin.name.split('/');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: repo,
    description: plugin.description ?? undefined,
    url: `${siteUrl}/${params.locale === 'en' ? '' : `${params.locale}/`}plugin/${params.name}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    inLanguage: params.locale,
  };

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      {/* 面包屑 */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
        <Link
          href="/"
          className="rounded-[var(--radius-sm)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus"
        >
          {t('breadcrumb.home')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--color-meta)]" aria-hidden="true" />
        <span className="truncate font-medium text-[var(--color-text-2)]">{repo}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* ===== 主内容 ===== */}
        <div className="space-y-6">
          {/* 标题区 */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {plugin.name}
            </h1>
            {plugin.description ? (
              <p className="mt-2 max-w-prose text-base leading-relaxed text-[var(--color-muted)]">
                {plugin.description}
              </p>
            ) : null}
          </div>

          {/* 四维度评分 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('scoreBreakdown.title')}</CardTitle>
              <p className="text-sm text-[var(--color-muted)]">
                {t('scoreBreakdown.subtitle')}
              </p>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown breakdown={plugin.scoreBreakdown} />
            </CardContent>
          </Card>

          {/* 安全标记 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('flags.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SecurityFlags flags={plugin.flags} />
            </CardContent>
          </Card>

          {/* Build your own CTA（Content Silo 回链教程） */}
          <Card className="border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)]">
            <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold tracking-tight text-[var(--color-text)]">
                  {t('buildYourOwn.title')}
                </p>
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-[var(--color-muted)]">
                  {t('buildYourOwn.body')}
                </p>
              </div>
              <Button asChild variant="secondary" className="shrink-0">
                <Link href="/tutorials">{t('buildYourOwn.cta')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ===== 侧栏 ===== */}
        <aside className="space-y-6">
          {/* 综合评分大卡（视觉锚点） */}
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--color-border)] p-6 text-center">
              <p className="label-caps text-[var(--color-meta)]">
                {t('gradeCard.total')}
              </p>
              <p
                className="tabular-nums mt-2 text-4xl font-bold tracking-tight"
                style={{ color: `var(--grade-${plugin.grade.toLowerCase()})` }}
              >
                {plugin.score}
                <span className="text-xl font-medium text-[var(--color-meta)]">
                  {t('gradeCard.outOf')}
                </span>
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <GradeBadge grade={plugin.grade} size="lg" />
                <span className="text-sm text-[var(--color-muted)]">
                  {t('gradeCard.gradeLabel')} {plugin.grade}
                </span>
              </div>
            </div>
            <CardContent className="pt-6">
              <MetaInfo plugin={plugin} />
            </CardContent>
          </Card>

          {/* GitHub 链接 */}
          <Button asChild variant="secondary" className="w-full">
            <a
              href={plugin.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tc('actions.viewOnGitHub')}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>

          {/* 质量徽章嵌入 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('badge.title')}</CardTitle>
              <p className="text-sm text-[var(--color-muted)]">
                {t('badge.subtitle')}
              </p>
            </CardHeader>
            <CardContent>
              <BadgeEmbed name={plugin.name} />
            </CardContent>
          </Card>

          {/* npm 信息卡 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
                {t('npm.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plugin.npmName ? (
                <dl className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-sm text-[var(--color-muted)]">
                      {t('npm.version')}
                    </dt>
                    <dd className="tabular-nums text-sm font-medium text-[var(--color-text-2)]">
                      {plugin.npmVersion ?? '—'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-sm text-[var(--color-muted)]">
                      {t('npm.downloads')}
                    </dt>
                    <dd className="tabular-nums text-sm font-medium text-[var(--color-text-2)]">
                      {plugin.npmDownloads != null
                        ? formatCompact(plugin.npmDownloads)
                        : '—'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  {t('npm.notAvailable')}
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* 404 fallback（理论上 notFound 已处理，此处兜底） */}
      {!plugin ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <SearchX className="h-10 w-10 text-[var(--color-meta)]" aria-hidden="true" />
          <p className="text-base font-medium text-[var(--color-text-2)]">
            {t('notFound.title')}
          </p>
          <Button asChild variant="secondary" size="sm">
            <Link href="/">{tc('actions.backToHome')}</Link>
          </Button>
        </div>
      ) : null}

      {/* 同类插件推荐（同 Grade） */}
      {similarPlugins.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-xl font-bold tracking-tight text-[var(--color-text)]">
            {t('similarPlugins.title')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarPlugins.map((sp) => (
              <Card key={sp.name} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/${params.locale === 'en' ? '' : `${params.locale}/`}plugin/${sp.name}`}
                      className="flex-1 font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {sp.name}
                    </Link>
                    <GradeBadge grade={sp.grade} size="sm" />
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{sp.description}</p>
                  <p className="mt-2 text-xs font-semibold text-[var(--color-meta)]">
                    Score: {sp.score}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
