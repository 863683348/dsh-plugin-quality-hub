## 热路径优化
Tool 被模型在紧密循环中调用。慢工具会阻塞整个对话。

```ts
// 差：tool 中同步文件读取
const content = fs.readFileSync(path, 'utf8');

// 好：带超时的异步
const content = await withTimeout(fs.readFile(path, 'utf8'), 5000);
```

## 缓存策略
缓存昂贵的计算。对热路径使用内存 LRU，对冷数据持久化到磁盘。