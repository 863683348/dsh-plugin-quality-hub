import { cn } from '@/lib/utils';
import type { Plugin } from '@/types/api';

/** 展示等级（A-D；后端 Grade 含 F 但评分封顶 D，UI 只渲染 A-D） */
export type PluginGrade = Plugin['grade'];

const gradeStyles: Record<PluginGrade, { badge: string; dot: string }> = {
  A: {
    badge: 'bg-[var(--grade-a-soft)] text-[var(--grade-a)]',
    dot: 'bg-[var(--grade-a)]',
  },
  B: {
    badge: 'bg-[var(--grade-b-soft)] text-[var(--grade-b)]',
    dot: 'bg-[var(--grade-b)]',
  },
  C: {
    badge: 'bg-[var(--grade-c-soft)] text-[var(--grade-c)]',
    dot: 'bg-[var(--grade-c)]',
  },
  D: {
    badge: 'bg-[var(--grade-d-soft)] text-[var(--grade-d)]',
    dot: 'bg-[var(--grade-d)]',
  },
};

interface GradeBadgeProps {
  grade: PluginGrade;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 等级胶囊徽章 — A/B/C/D 四色（Spec 锁定 --grade-*）
 * sm: 表内紧凑 16px 高；md: 卡片标准 20px；lg: 详情页大号
 */
export function GradeBadge({ grade, size = 'md', className }: GradeBadgeProps) {
  const sizes = {
    sm: 'h-4 min-w-6 px-1.5 text-[10px]',
    md: 'h-5 min-w-7 px-2 text-xs',
    lg: 'h-7 min-w-9 px-3 text-sm',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-full)] font-bold',
        sizes[size],
        gradeStyles[grade].badge,
        className
      )}
      aria-label={`Grade ${grade}`}
    >
      {grade}
    </span>
  );
}

/** 等级色点（图例/分布用） */
export function GradeDot({ grade }: { grade: PluginGrade }) {
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-[var(--radius-full)]', gradeStyles[grade].dot)}
      aria-hidden="true"
    />
  );
}
