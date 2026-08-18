import { ShieldCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { NewsletterSubscribe } from '@/components/newsletter-subscribe';

const footerLinks = [
  { href: '/plugins', key: 'nav.allPlugins' },
  { href: '/tutorials', key: 'nav.tutorials' },
  { href: '/examples', key: 'nav.examples' },
  { href: '/trending', key: 'nav.trending' },
  { href: '/security', key: 'nav.security' },
  { href: '/weekly', key: 'nav.weekly' },
  { href: '/pricing', key: 'nav.pricing' },
  { href: '/method', key: 'nav.method' },
  { href: '/about', key: 'nav.about' },
] as const;

const legalLinks = [
  { href: '/privacy', key: 'footer.legal.privacy' },
  { href: '/terms', key: 'footer.legal.terms' },
  { href: '/faq', key: 'footer.legal.faq' },
  { href: '/blog', key: 'footer.legal.blog' },
  { href: '/contact', key: 'footer.legal.contact' },
] as const;

export async function Footer() {
  const t = await getTranslations('common');
  const tw = await getTranslations('weekly');
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
      <div className="container-page grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="h-5 w-5 text-[var(--color-primary)]"
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-[var(--color-text)]">
              {t('brandName')}
            </span>
          </div>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-muted)]">
            {t('footer.brandDescription')}
          </p>
          <p className="mt-3 max-w-prose text-xs leading-relaxed text-[var(--color-meta)]">
            {t('footer.securityNotice')}
          </p>
        </div>

        <div>
          <h3 className="label-caps text-[var(--color-text-2)]">
            {t('footer.quickLinks')}
          </h3>
          <ul className="mt-3 space-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[var(--color-muted)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus rounded-[var(--radius-sm)]"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="label-caps text-[var(--color-text-2)]">
            {t('footer.legal.title')}
          </h3>
          <ul className="mt-3 space-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[var(--color-muted)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus rounded-[var(--radius-sm)]"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="label-caps text-[var(--color-text-2)]">
            {tw('section.title')}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
            {tw('section.subtitle')}
          </p>
          <NewsletterSubscribe
            source="footer"
            compact
            className="mt-3"
          />
        </div>
      </div>
      <div className="border-t border-[var(--color-border)]">
        <div className="container-page flex flex-col gap-1 py-5 text-xs text-[var(--color-meta)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t('brandName')} · dshquality.com
          </span>
          <span>
            <a
              href="mailto:ahmedlzany423@gmail.com"
              className="text-[var(--color-meta)] transition-colors duration-fast ease-standard hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:shadow-focus rounded-[var(--radius-sm)]"
            >
              ahmedlzany423@gmail.com
            </a>
            {' · '}
            {t('footer.rights')}
          </span>
        </div>
      </div>
    </footer>
  );
}
