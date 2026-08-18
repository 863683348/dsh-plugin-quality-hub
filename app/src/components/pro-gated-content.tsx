'use client';

// ============================================================
// ProGatedContent — SSG 付费墙客户端组件 (v1.3)
// 用法: 服务端把公开预览 (前 1/4 正文) 作为 children 传入
//       hydration 后请求 /api/v1/me:
//         - pro 用户: 请求 /api/v1/content/:type/:slug 拉完整正文替换
//         - free 用户: 保留预览 + 底部升级浮层
//       tier=free 的内容直接渲染完整 children (不请求)
// ============================================================

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { MarkdownContent } from '@/components/markdown-content';

interface ProGatedContentProps {
  type: 'tutorials' | 'examples';
  slug: string;
  locked: boolean; // 内容 tier=pro
  locale: 'en' | 'zh';
  children: React.ReactNode; // 免费预览内容 (SSG 已截断)
  fallbackKey?: string; // 内容加载失败时的提示 key
}

interface MeResponse {
  code: number;
  data?: {
    isPro: boolean;
  };
}

// 模块级缓存: 同一 slug 的全文只拉一次 (实例页 3 个维度卡共享)
const contentCache = new Map<string, { contentEn: string; contentZh: string }>();
let meProCache: boolean | null = null;

export function ProGatedContent({
  type,
  slug,
  locked,
  locale,
  children,
}: ProGatedContentProps) {
  const t = useTranslations('membership.gate');
  const [full, setFull] = React.useState<React.ReactNode | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [pro, setPro] = React.useState(false);

  // 只有 locked 内容需要鉴权拉全文
  React.useEffect(() => {
    if (!locked) return;
    let cancelled = false;
    (async () => {
      try {
        let isProUser = false;
        if (meProCache !== null) {
          isProUser = meProCache;
        } else {
          const meRes = await fetch('/api/v1/me', { cache: 'no-store' });
          const me = (await meRes.json()) as MeResponse;
          if (cancelled) return;
          isProUser = meRes.ok && me.code === 0 && !!me.data?.isPro;
          meProCache = isProUser;
        }
        setPro(isProUser);
        if (isProUser) {
          const cacheKey = `${type}/${slug}`;
          const cached = contentCache.get(cacheKey);
          let body:
            | {
                code: number;
                data?: {
                  contentEn: string;
                  contentZh: string;
                };
              }
            | undefined;
          if (cached) {
            body = { code: 0, data: cached };
          } else {
            setLoading(true);
            const res = await fetch(`/api/v1/content/${type}/${slug}`, {
              cache: 'no-store',
            });
            body = (await res.json()) as typeof body;
            if (!cancelled && res.ok && body?.code === 0 && body.data) {
              contentCache.set(cacheKey, body.data);
            }
            setLoading(false);
          }
          if (!cancelled && body?.code === 0 && body.data) {
            const content =
              locale === 'zh' ? body.data.contentZh : body.data.contentEn;
            setFull(<MarkdownContent content={content} />);
          }
        }
      } catch {
        if (!cancelled) setPro(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locked, type, slug, locale]);

  // tier=free 内容: 直接渲染完整 children
  if (!locked) return <>{children}</>;

  // pro 用户已拉取全文
  if (full) return <>{full}</>;

  return (
    <div>
      {children}
      <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-[var(--color-text)]">
          {loading ? t('loading') : t('title')}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
          {loading ? t('fetching') : t('body')}
        </p>
        {!loading && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-on)] transition-colors duration-fast ease-standard hover:opacity-90 focus-visible:outline-none focus-visible:shadow-focus"
            >
              {t('cta')}
            </Link>
            {!pro && (
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text-2)] transition-colors duration-fast ease-standard hover:bg-[var(--color-surface-3)] focus-visible:outline-none focus-visible:shadow-focus"
              >
                {t('signIn')}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
