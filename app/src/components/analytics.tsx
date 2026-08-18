// GA4 Analytics (next/script + gtag.js)
// ID 优先级: NEXT_PUBLIC_GA_ID 环境变量 > 默认 G-CW5VXQTCXH
// 策略: afterInteractive — 不阻塞首屏渲染, 页面交互后加载
// 增强: anonymize_ip 开启（GA4 隐私最佳实践, IP 脱敏）

import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-CW5VXQTCXH";

export function Analytics() {
  if (!GA_ID) return null;

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
