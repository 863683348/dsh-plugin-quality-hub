## Multi-file plugins
As your plugin grows, a single `index.ts` becomes unwieldy. Split into multiple files and let `dsh.bundle.patch` point to the entry:

```json
{
  "dsh": { "bundle": { "patch": ["dist/index.js"] } }
}
```

Build your project with TypeScript, output to `dist/`, and ship the compiled JS. Source maps are optional but helpful for debugging.