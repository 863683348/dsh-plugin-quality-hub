## Config is how users talk to your plugin
Every plugin receives a `config` object from the user. This is the primary configuration channel — settings, API keys, feature flags, everything flows through here.

## The config shape
```ts
export function apply(ctx, config) {
  const apiKey = config.apiKey ?? process.env.MY_API_KEY;
  const mode = config.mode ?? 'standard';
  // ...
}
```

Config values are merged from multiple sources: the user's profile config, environment variables, and plugin defaults. The `??` operator gives you a clean fallback chain.

## Schema validation
For complex configs, define a schema and validate:

```ts
import { z } from 'zod';

const ConfigSchema = z.object({
  mode: z.enum(['standard', 'aggressive', 'safe']).default('standard'),
  timeout: z.number().min(1000).max(30000).default(5000),
});

export function apply(ctx, rawConfig) {
  const config = ConfigSchema.parse(rawConfig);
  // config is now typed and validated
}
```

Validation errors become user-friendly messages instead of runtime crashes.