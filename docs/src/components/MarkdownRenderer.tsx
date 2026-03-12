import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#1E1E1E] prose-pre:p-0 prose-pre:border prose-pre:border-border/50">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            
            // Inline code blocks (e.g. `const a = 1`)
            if (inline || !match) {
              return (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono text-muted-foreground"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Syntax highlighted code blocks
            return (
              <div className="relative rounded-lg overflow-hidden my-6">
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{match[1]}</span>
                  <div className="flex gap-1.5">
                     <div className="w-3 h-3 rounded-full bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]"></div>
                  </div>
                </div>
                <SyntaxHighlighter
                  {...props}
                  style={vscDarkPlus as any}
                  language={match[1]}
                  PreTag="div"
                  className="!m-0 !rounded-none !bg-zinc-950 p-4 text-sm font-mono overflow-x-auto"
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
