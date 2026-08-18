import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[var(--badge-radius)] px-[var(--badge-padding-x)] py-[var(--badge-padding-y)] text-[var(--badge-font-size)] font-[var(--badge-weight)] transition-colors duration-fast ease-standard',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
        secondary:
          'bg-[var(--color-surface-2)] text-[var(--color-text-2)] border border-[var(--color-border)]',
        outline:
          'border border-[var(--color-border-strong)] text-[var(--color-text-2)]',
        success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
        warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
        danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
        info: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
