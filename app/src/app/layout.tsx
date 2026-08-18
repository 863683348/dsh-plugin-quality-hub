import type { ReactNode } from 'react';
import '@/styles/globals.css';

/**
 * Root layout — 极薄壳：仅渲染 [locale] 段
 * （next-intl App Router 要求 html/body 放在 [locale]/layout.tsx）
 * 全局样式必须在此导入（Next.js App Router 限制：全局 CSS 只能来自根 layout）
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
