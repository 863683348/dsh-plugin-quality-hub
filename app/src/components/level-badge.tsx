import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TutorialLevel } from '@/types/content';

const LEVEL_VARIANT: Record<TutorialLevel, 'default' | 'info' | 'warning'> = {
  beginner: 'default',
  intermediate: 'info',
  advanced: 'warning',
};

const LEVEL_COLOR: Record<TutorialLevel, string> = {
  beginner: 'text-[var(--color-primary)]',
  intermediate: 'text-[var(--color-info)]',
  advanced: 'text-[var(--color-warning)]',
};

export function LevelBadge({
  level,
  label,
  className,
}: {
  level: TutorialLevel;
  label: string;
  className?: string;
}) {
  return (
    <Badge variant={LEVEL_VARIANT[level]} className={cn(LEVEL_COLOR[level], className)}>
      {label}
    </Badge>
  );
}
