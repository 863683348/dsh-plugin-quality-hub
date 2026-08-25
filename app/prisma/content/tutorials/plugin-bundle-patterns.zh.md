## 多文件插件
当插件增长时，单个 `index.ts` 会变得臃肿。拆成多个文件，让 `dsh.bundle.patch` 指向入口：

```json
{
  "dsh": { "bundle": { "patch": ["dist/index.js"] } }
}
```

用 TypeScript 构建项目，输出到 `dist/`，分发编译后的 JS。source map 是可选的，但对调试有帮助。