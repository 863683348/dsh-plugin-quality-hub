import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SecurityFlagType } from '@/types/api';

const config: Record<
  SecurityFlagType,
  { Icon: typeof Info; color: string; className: string }
> = {
  danger: {
    Icon: AlertOctagon,
    color: 'var(--color-danger)',
    className: 'text-[var(--color-danger)]',
  },
  warning: {
    Icon: AlertTriangle,
    color: 'var(--color-warning)',
    className: 'text-[var(--color-warning)]',
  },
  info: {
    Icon: Info,
    color: 'var(--color-info)',
    className: 'text-[var(--color-info)]',
  },
};

interface SecurityFlagProps {
  type: SecurityFlagType;
  label: string;
  detail?: string;
  className?: string;
  /** danger 文字加粗（危险级别一目了然） */
  emphasized?: boolean;
}

/**
 * 安全标记 — danger(AlertOctagon 红) / warning(AlertTriangle 橙) / info(Info 蓝)
 */
export function SecurityFlag({
  type,
  label,
  detail,
  className,
  emphasized = false,
}: SecurityFlagProps) {
  const { Icon } = config[type];
  return (
    <div
      className={cn('flex items-start gap-1.5', className)}
      data-flag-type={type}
    >
      <Icon
        className={cn('mt-0.5 h-4 w-4 shrink-0', config[type].className)}
        style={{ color: config[type].color }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <span
          className={cn(
            'text-sm',
            emphasized ? 'font-semibold' : 'font-medium',
            config[type].className
          )}
        >
          {label}
        </span>
        {detail ? (
          <span className="ml-1.5 text-sm text-[var(--color-muted)]">
            {detail}
          </span>
        ) : null}
      </div>
    </div>
  );
}
