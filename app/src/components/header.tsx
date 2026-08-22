'use client';

import * as React from 'react';
import { Globe, Menu, Moon, ShieldCheck, Sun, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, Link } from '@/i18n/navigation';
import { useTheme } from '@/components/theme-provider';
import { AccountStatus } from '@/components/account-status';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', key: 'topRated' },
  { href: '/plugins', key: 'allPlugins' },
  { href: '/tutorials', key: 'tutorials' },
  { href: '/examples', key: 'examples' },
  { href: '/trending', key: 'trending' },
  { href: '/security', key: 'security' },
  { href: '/low-quality', key: 'lowQuality' },
  { href: '/weekly', key: 'weekly' },
  { href: '/pricing', key: 'pricing' },
  { href: '/method', key: 'method' },
  { href: '/about', key: 'about' },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations('common.theme');
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:shadow-focus"
      aria-label={isDark ? t('light') : t('dark')}
      title={isDark ? t('light') : t('dark')}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

function LocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');
  const [isPending, startTransition] = React.useTransition();

  const switchTo = (next: 'en' | 'zh') => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      className="inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5"
      role="group"
      aria-label={t('language')}
    >
      <Globe className="ml-1.5 h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden="true" />
      {(['en', 'zh'] as const).map((loc) => (
        <button
          key={loc}
          type="button"
          disabled={isPending}
          onClick={() => switchTo(loc)}
          className={cn(
            'rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:shadow-focus',
            locale === loc
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-on)]'
              : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-2)]'
          )}
        >
          {loc === 'en' ? 'EN' : '中文'}
        </button>
      ))}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('common.nav');
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            'label-caps rounded-[var(--radius-md)] px-3 py-2 text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:shadow-focus',
            isActive(item.href) &&
              'text-[var(--color-primary)] hover:text-[var(--color-primary)]'
          )}
          aria-current={isActive(item.href) ? 'page' : undefined}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}

export function Header() {
  const t = useTranslations('common');
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 h-[var(--nav-height)] border-b border-[var(--nav-border)] bg-[var(--color-bg)]/90 backdrop-blur-sm">
      <div className="container-page flex h-full items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:shadow-focus"
          aria-label={t('brandName')}
        >
          <ShieldCheck
            className="h-6 w-6 text-[var(--color-primary)]"
            aria-hidden="true"
          />
          <span className="text-base font-bold tracking-tight text-[var(--color-text)]">
            {t('brandName')}
          </span>
        </Link>

        {/* 桌面导航 */}
        <div className="hidden md:block">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitch />
          <ThemeToggle />
          <AccountStatus />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:shadow-focus md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* 移动端抽屉 */}
      {menuOpen ? (
        <div className="border-t border-[var(--nav-border)] bg-[var(--color-bg)] px-4 py-3 md:hidden">
          <NavLinks
            onNavigate={() => {
              setMenuOpen(false);
            }}
          />
        </div>
      ) : null}
    </header>
  );
}
