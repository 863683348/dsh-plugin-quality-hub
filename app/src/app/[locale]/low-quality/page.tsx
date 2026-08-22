import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AlertTriangle, FlaskConical, ShieldAlert } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { GradeBadge, type PluginGrade } from '@/components/grade-badge';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface LowQualityPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: LowQualityPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'lowQuality' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/low-quality' : `/${locale}/low-quality`;
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/low-quality`,
        zh: `${siteUrl}/zh/low-quality`,
      },
    },
  };
}

interface LowRow {
  name: string;
  synthetic: boolean;
  score: number;
  grade: string;
  stars: number;
  githubUrl: string | null;
  flags: unknown;
}

export default async function LowQualityPage({ params }: LowQualityPageProps) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'lowQuality' });

  let rows: LowRow[] = [];
  let dbError = false;
  try {
    const data = await prisma.lowQualityPlugin.findMany({
      orderBy: [{ grade: 'asc' }, { score: 'asc' }],
      take: 120,
    });
    rows = data.map((p) => ({
      name: p.name,
      synthetic: p.synthetic,
      score: p.score,
      grade: p.grade,
      stars: p.stars,
      githubUrl: p.githubUrl,
      flags: p.flags,
    }));
  } catch (e) {
    console.error('lowQuality DB error', e);
    dbError = true;
  }

  const syntheticCount = rows.filter((r) => r.synthetic).length;
  const realCount = rows.length - syntheticCount;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Warning banner — the whole point of this page */}
      <div className="mb-8 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-[var(--color-danger)]" aria-hidden="true" />
          <div>
            <p className="font-semibold text-[var(--color-danger)]">
              {t('warningBanner')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('notice')}
            </p>
          </div>
        </div>
      </div>

      {/* Why */}
      <div className="mb-8 rounded-xl border p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" aria-hidden="true" />
          {t('why.title')}
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {(t.raw('why.points') as string[]).map((point: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-danger)]" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Stats */}
      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border px-3 py-1">
          {t('syntheticBadge')} · {syntheticCount}
        </span>
        <span className="rounded-full border px-3 py-1">
          {t('realBadge')} · {realCount}
        </span>
      </div>

      {/* Table */}
      {dbError ? (
        <div className="rounded-xl border p-6 text-center text-muted-foreground">{t('table.empty')}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border p-6 text-center text-muted-foreground">{t('table.empty')}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('table.plugin')}</th>
                  <th className="px-4 py-3 font-medium">{t('table.grade')}</th>
                  <th className="px-4 py-3 font-medium">{t('table.score')}</th>
                  <th className="px-4 py-3 font-medium">{t('table.stars')}</th>
                  <th className="px-4 py-3 font-medium">{t('table.flags')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const flagList = (Array.isArray(row.flags) ? row.flags : []) as string[];
                  return (
                    <tr key={row.name} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.synthetic ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10 px-2 py-0.5 text-xs text-[var(--color-warning)]"
                              title={t('syntheticBadge')}
                            >
                              <FlaskConical className="h-3 w-3" aria-hidden="true" />
                              {t('syntheticBadge')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-danger)]/50 bg-[var(--color-danger)]/10 px-2 py-0.5 text-xs text-[var(--color-danger)]">
                              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                              {t('realBadge')}
                            </span>
                          )}
                          {row.githubUrl ? (
                            <a
                              href={row.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline"
                            >
                              {row.name}
                            </a>
                          ) : (
                            <span className="font-medium text-muted-foreground">{row.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <GradeBadge grade={row.grade as PluginGrade} />
                      </td>
                      <td className={cn('px-4 py-3 font-medium', row.score < 40 ? 'text-[var(--color-danger)]' : 'text-muted-foreground')}>
                        {row.score}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.stars}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {flagList.slice(0, 2).map((f, i) => (
                            <span
                              key={i}
                              className="inline-block max-w-[180px] truncate rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                            >
                              {f}
                            </span>
                          ))}
                          {flagList.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{flagList.length - 2}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/plugins"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          ← {t('notice')}
        </Link>
      </div>
    </div>
  );
}
