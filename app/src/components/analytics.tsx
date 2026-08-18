// GA4 Analytics (next/script + gtag.js)
// ID 优先级: NEXT_PUBLIC_GA_ID 环境变量 > 默认 G-CW5VXQTCXH
// 策略: afterInteractive — 不阻塞首屏渲染, 页面交互后加载
// 增强: anonymize_ip 开启（GA4 隐私最佳实践, IP 脱敏）
// 加载条件: 仅生产环境 (NODE_ENV==='production' && VERCEL_ENV!=='preview')，避免 localhost / Preview 污染 GA4 数据

import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-CW5VXQTCXH";

function isProduction(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  // Vercel Preview 部署不加载（避免预览流量污染生产 GA4 数据）
  if (process.env.VERCEL_ENV === "preview") return false;
  return true;
}

export function Analytics() {
  if (!GA_ID) return null;
  if (!isProduction()) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
