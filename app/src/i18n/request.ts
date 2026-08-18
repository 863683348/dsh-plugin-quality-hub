import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./locales/${locale}`)).default,
    // 缺 key 时兜底，避免整页 500（Spec 内嵌已知坑）
    getMessageFallback: ({ key }) => {
      const fallback = `[${key}]`;
      return fallback;
    },
    onError: () => {
      // swallow: message 缺失时回退到 key，不抛异常
    },
  };
});
