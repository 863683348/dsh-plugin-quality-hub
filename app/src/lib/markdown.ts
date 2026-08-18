// ============================================================
// 极简 Markdown 子集解析器 (Spec §3.5, 决策 D5)
// 纯函数: 字符串 -> token 树, 可单测; 渲染层(src/components/markdown-content.tsx)
// 负责将 token 树映射为 React 节点, 全程不碰 dangerouslySetInnerHTML。
// 支持子集: h2/h3 / 段落 / **bold** / `inline code` / ```lang 代码围栏
//           / 无序[-*]与有序[1.]列表 / [label](href) 链接 / > 引用块
// 未知语法一律按纯文本转义输出(降级不炸页)。
// ============================================================

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: InlineNode[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; children: InlineNode[] };

export type MarkdownNode =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'list'; ordered: boolean; items: InlineNode[][] }
  | { type: 'blockquote'; children: InlineNode[] };

const INLINE_PATTERN =
  /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))/g;

/** 行内解析: bold / code / link, 其余为文本 */
export function parseInline(input: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(input)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: input.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      nodes.push({ type: 'bold', children: [{ type: 'text', value: match[2] }] });
    } else if (match[4] !== undefined) {
      nodes.push({ type: 'code', value: match[4] });
    } else if (match[6] !== undefined && match[7] !== undefined) {
      nodes.push({
        type: 'link',
        href: match[7],
        children: [{ type: 'text', value: match[6] }],
      });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < input.length) {
    nodes.push({ type: 'text', value: input.slice(lastIndex) });
  }
  return nodes;
}

const BLOCK_LINE_PATTERNS =
  /^(##\s|###\s|```|>\s|[-*]\s|\d+\.\s)/;

/** 块级解析: 逐行扫描, 支持 h2/h3 / 引用 / 代码围栏 / 列表 / 段落 */
export function parseMarkdown(source: string): MarkdownNode[] {
  const lines = source.split(/\r?\n/);
  const nodes: MarkdownNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.*)$/);
    if (h2) {
      nodes.push({ type: 'h2', text: h2[1].trim() });
      i++;
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.*)$/);
    if (h3) {
      nodes.push({ type: 'h3', text: h3[1].trim() });
      i++;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const block: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        block.push(lines[i].trim().slice(2));
        i++;
      }
      nodes.push({ type: 'blockquote', children: parseInline(block.join(' ')) });
      continue;
    }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      nodes.push({ type: 'code', lang, code: code.join('\n') });
      continue;
    }

    const isUl = trimmed.match(/^[-*]\s+(.*)$/);
    const isOl = trimmed.match(/^\d+\.\s+(.*)$/);
    if (isUl || isOl) {
      const ordered = Boolean(isOl);
      const items: InlineNode[][] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = ordered ? t.match(/^\d+\.\s+(.*)$/) : t.match(/^[-*]\s+(.*)$/);
        if (!m) break;
        items.push(parseInline(m[1]));
        i++;
      }
      nodes.push({ type: 'list', ordered, items });
      continue;
    }

    // 段落: 连续非空且非块级起始行
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !BLOCK_LINE_PATTERNS.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    nodes.push({ type: 'paragraph', children: parseInline(para.join(' ')) });
  }

  return nodes;
}
