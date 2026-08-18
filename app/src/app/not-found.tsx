import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <div className="container-page flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-6xl font-bold tracking-tight text-[var(--color-primary)]">
          404
        </p>
        <p className="text-base text-[var(--color-muted)]">
          Page not found
        </p>
        <Button asChild variant="secondary" size="sm">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </NextIntlClientProvider>
  );
}
