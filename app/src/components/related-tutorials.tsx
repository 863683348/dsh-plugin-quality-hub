import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { Tutorial } from '@prisma/client';

export function RelatedTutorials({
  tutorials,
  locale,
  title,
}: {
  tutorials: Tutorial[];
  locale: 'en' | 'zh';
  title: string;
}) {
  if (tutorials.length === 0) return null;
  const isZh = locale === 'zh';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <div className="space-y-1 px-6 pb-6">
        {tutorials.map((t) => (
          <Link
            key={t.slug}
            href={`/tutorials/${t.slug}`}
            className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:shadow-focus"
          >
            <span className="block text-sm font-medium text-[var(--color-text-2)] group-hover:text-[var(--color-primary)]">
              {isZh ? t.titleZh : t.titleEn}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-meta)] transition-transform duration-fast ease-standard group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
