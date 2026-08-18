import { cn } from '@/lib/utils';
import { gradeFromScore } from '@/lib/format';

const fillColor = (score: number) => {
  const grade = gradeFromScore(score);
  switch (grade) {
    case 'A':
      return 'var(--grade-a)';
    case 'B':
      return 'var(--grade-b)';
    case 'C':
      return 'var(--grade-c)';
    default:
      return 'var(--grade-d)';
  }
};

interface ScoreBarProps {
  score: number;
  max?: number;
  size?: 'sm' | 'lg';
  showValue?: boolean;
  className?: string;
  /** 自定义轨道/填充颜色（详情页四维度用） */
  color?: string;
}

/**
 * 评分条 — track(surface-3) + fill(宽度%) + mono 数字
 * 颜色：>90 A / >75 B / >60 C / else D（与评分算法阈值一致）
 */
export function ScoreBar({
  score,
  max = 100,
  size = 'sm',
  showValue = true,
  color,
  className,
}: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const height = size === 'lg' ? 'h-2.5' : 'h-1.5';
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-3)]',
          height
        )}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn('h-full rounded-[var(--radius-full)]', height)}
          style={{
            width: `${pct}%`,
            backgroundColor: color ?? fillColor(score),
          }}
        />
      </div>
      {showValue && (
        <span className="tabular-nums w-10 shrink-0 text-right text-xs font-medium text-[var(--color-text-2)]">
          {score}
          <span className="text-[var(--color-meta)]">/{max}</span>
        </span>
      )}
    </div>
  );
}
