import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LevelBadge } from '@/components/level-badge';
import { Link } from '@/i18n/navigation';
import type { Tutorial } from '@prisma/client';
import type { TutorialLevel } from '@/types/content';

export function TutorialCard({
  tutorial,
  locale,
  levelLabel,
}: {
  tutorial: Tutorial;
  locale: 'en' | 'zh';
  levelLabel: string;
}) {
  const isZh = locale === 'zh';
  const title = isZh ? tutorial.titleZh : tutorial.titleEn;
  const excerpt = isZh ? tutorial.excerptZh : tutorial.excerptEn;
  const reading = isZh
    ? `${tutorial.readingMinutes} 分钟阅读`
    : `${tutorial.readingMinutes} min read`;

  return (
    <Card className="h-full transition-shadow duration-fast ease-standard hover:shadow-ring">
      <Link
        href={`/tutorials/${tutorial.slug}`}
        className="flex h-full flex-col gap-3 p-6 rounded-[var(--card-radius)] focus-visible:outline-none focus-visible:shadow-focus"
      >
        <div className="flex items-center justify-between gap-2">
          <LevelBadge level={tutorial.level as TutorialLevel} label={levelLabel} />
          <span className="flex items-center gap-1 text-xs text-[var(--color-meta)]">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {reading}
          </span>
        </div>
        <h3 className="text-base font-semibold leading-snug tracking-tight text-[var(--color-text)]">
          {title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-[var(--color-muted)]">
          {excerpt}
        </p>
      </Link>
    </Card>
  );
}
