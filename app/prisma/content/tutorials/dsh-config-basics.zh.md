## Config 是用户和插件对话的通道
每个插件都会从用户那里收到一个 `config` 对象。这是主要的配置渠道——设置、API 密钥、功能开关，一切都在这里传递。

## Config 的形态
```ts
export function apply(ctx, config) {
  const apiKey = config.apiKey ?? process.env.MY_API_KEY;
  const mode = config.mode ?? 'standard';
  // ...
}
```

Config 值从多个来源合并：用户的 profile 配置、环境变量、插件默认值。`??` 运算符给你一条干净的 fallback 链。

## Schema 校验
对于复杂配置，定义 schema 并校验：

```ts
import { z } from 'zod';

const ConfigSchema = z.object({
  mode: z.enum(['standard', 'aggressive', 'safe']).default('standard'),
  timeout: z.number().min(1000).max(30000).default(5000),
});

export function apply(ctx, rawConfig) {
  const config = ConfigSchema.parse(rawConfig);
  // config 现在是有类型且已校验的
}
```

校验错误会变成用户友好的提示，而不是运行时崩溃。