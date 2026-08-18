import { ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import type { Example } from '@prisma/client';

export function ExampleCard({
  example,
  locale,
  categoryLabel,
}: {
  example: Example;
  locale: 'en' | 'zh';
  categoryLabel: string;
}) {
  const isZh = locale === 'zh';
  const title = isZh ? example.titleZh : example.titleEn;
  const excerpt = isZh ? example.excerptZh : example.excerptEn;

  return (
    <Card className="h-full transition-shadow duration-fast ease-standard hover:shadow-ring">
      <Link
        href={`/examples/${example.slug}`}
        className="flex h-full flex-col gap-3 p-6 rounded-[var(--card-radius)] focus-visible:outline-none focus-visible:shadow-focus"
      >
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{categoryLabel}</Badge>
          <ArrowUpRight className="h-4 w-4 text-[var(--color-meta)]" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold leading-snug tracking-tight text-[var(--color-text)]">
          {title}
        </h3>
        <p className="font-mono text-xs text-[var(--color-meta)]">{example.pluginName}</p>
        <p className="line-clamp-3 text-sm leading-relaxed text-[var(--color-muted)]">
          {excerpt}
        </p>
      </Link>
    </Card>
  );
}
