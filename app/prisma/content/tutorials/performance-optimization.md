## Hot path optimization
Tools are called by the model in tight loops. Slow tools block the entire conversation.

```ts
// Bad: synchronous file read in tool
const content = fs.readFileSync(path, 'utf8');

// Good: async with timeout
const content = await withTimeout(fs.readFile(path, 'utf8'), 5000);
```

## Caching strategies
Cache expensive computations. Use in-memory LRU for hot paths, persist to disk for cold data.