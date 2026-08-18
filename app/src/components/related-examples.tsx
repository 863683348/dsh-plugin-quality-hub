import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { Example } from '@prisma/client';

export function RelatedExamples({
  examples,
  locale,
  title,
}: {
  examples: Example[];
  locale: 'en' | 'zh';
  title: string;
}) {
  if (examples.length === 0) return null;
  const isZh = locale === 'zh';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <div className="space-y-1 px-6 pb-6">
        {examples.map((e) => (
          <Link
            key={e.slug}
            href={`/examples/${e.slug}`}
            className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:shadow-focus"
          >
            <span>
              <span className="block text-sm font-medium text-[var(--color-text-2)] group-hover:text-[var(--color-primary)]">
                {isZh ? e.titleZh : e.titleEn}
              </span>
              <span className="mt-0.5 block font-mono text-xs text-[var(--color-meta)]">
                {e.pluginName}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-meta)] transition-transform duration-fast ease-standard group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
