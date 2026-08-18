import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { GradeBadge } from '@/components/grade-badge';
import { Link } from '@/i18n/navigation';
import { formatCompact } from '@/lib/format';
import type { Plugin as ApiPlugin } from '@/types/api';

export function RelatedPlugins({
  plugins,
  title,
  viewOnHubLabel,
}: {
  plugins: ApiPlugin[];
  title: string;
  viewOnHubLabel: string;
}) {
  if (plugins.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <div className="space-y-1 px-6 pb-6">
        {plugins.map((p) => (
          <Link
            key={p.name}
            href={`/plugin/${encodeURIComponent(p.name)}`}
            className="group flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:shadow-focus"
          >
            <span className="min-w-0">
              <span className="block truncate font-mono text-sm font-medium text-[var(--color-text-2)] group-hover:text-[var(--color-primary)]">
                {p.name}
              </span>
              <span className="mt-0.5 block truncate text-xs text-[var(--color-meta)]">
                {p.stars > 0 ? `${formatCompact(p.stars)} stars` : viewOnHubLabel}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="tabular-nums text-sm font-semibold text-[var(--color-text-2)]">
                {p.score}
              </span>
              <GradeBadge grade={p.grade} />
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
