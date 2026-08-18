import { parseMarkdown, type InlineNode } from '@/lib/markdown';

/**
 * Markdown 子集渲染器 (Spec §3.5) — token 树 -> React 节点。
 * 全程不碰 dangerouslySetInnerHTML: 文本经 React 转义, 天然防 XSS。
 */

function renderInline(nodes: InlineNode[], keyPrefix: string) {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case 'text':
        return <span key={key}>{node.value}</span>;
      case 'bold':
        return (
          <strong key={key} className="font-semibold text-[var(--color-text)]">
            {renderInline(node.children, key)}
          </strong>
        );
      case 'code':
        return (
          <code
            key={key}
            className="rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[0.875em] text-[var(--color-primary)]"
          >
            {node.value}
          </code>
        );
      case 'link':
        return (
          <a
            key={key}
            href={node.href}
            target={node.href.startsWith('http') ? '_blank' : undefined}
            rel={node.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="font-medium text-[var(--color-primary)] underline underline-offset-2 transition-colors duration-fast ease-standard hover:text-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:shadow-focus rounded-[var(--radius-sm)]"
          >
            {renderInline(node.children, key)}
          </a>
        );
    }
  });
}

export function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseMarkdown(content);

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const key = `block-${i}`;
        switch (block.type) {
          case 'h2':
            return (
              <h2
                key={key}
                className="mt-8 mb-3 text-xl font-bold tracking-tight text-[var(--color-text)] first:mt-0"
              >
                {block.text}
              </h2>
            );
          case 'h3':
            return (
              <h3
                key={key}
                className="mt-6 mb-2 text-base font-semibold tracking-tight text-[var(--color-text)] first:mt-0"
              >
                {block.text}
              </h3>
            );
          case 'paragraph':
            return (
              <p
                key={key}
                className="my-4 max-w-prose text-[15px] leading-relaxed text-[var(--color-text-2)]"
              >
                {renderInline(block.children, key)}
              </p>
            );
          case 'code':
            return (
              <div key={key} className="my-4 overflow-hidden rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-surface-3)]">
                {block.lang ? (
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-1.5">
                    <span className="label-caps text-[var(--color-meta)]">
                      {block.lang}
                    </span>
                  </div>
                ) : null}
                <pre className="overflow-x-auto border-l-[3px] border-l-[var(--color-primary)] p-4">
                  <code className="font-mono text-[13px] leading-relaxed text-[var(--color-text-2)]">
                    {block.code}
                  </code>
                </pre>
              </div>
            );
          case 'list':
            return block.ordered ? (
              <ol key={key} className="my-4 list-decimal space-y-1.5 pl-6 text-[15px] leading-relaxed text-[var(--color-text-2)] marker:font-medium marker:text-[var(--color-meta)]">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ol>
            ) : (
              <ul key={key} className="my-4 list-disc space-y-1.5 pl-6 text-[15px] leading-relaxed text-[var(--color-text-2)] marker:text-[var(--color-primary)]">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'blockquote':
            return (
              <blockquote
                key={key}
                className="my-4 border-l-[3px] border-l-[var(--color-primary)] bg-[var(--color-primary-soft)] py-2 pl-4 pr-3 text-[15px] leading-relaxed text-[var(--color-text-2)]"
              >
                {renderInline(block.children, key)}
              </blockquote>
            );
        }
      })}
    </div>
  );
}
