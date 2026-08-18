'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * 搜索栏 — Input + Search 图标（绝对定位）+ 清除按钮
 * 键盘：Enter 提交，Escape 清空；焦点态 --shadow-focus + 主色边框
 */
export function SearchBar({ value, onChange, className }: SearchBarProps) {
  const t = useTranslations('home.search');
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('placeholder')}
        className="pl-10 pr-10"
        aria-label={t('placeholder')}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange('');
            inputRef.current?.blur();
          }
        }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[var(--radius-sm)] p-1 text-[var(--color-muted)] transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-2)] focus-visible:outline-none focus-visible:shadow-focus"
          aria-label={t('emptyTitle')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
