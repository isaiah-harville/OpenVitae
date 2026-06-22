import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders GitHub-flavored Markdown. Raw HTML is intentionally not enabled, so
// untrusted content can't inject markup.
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
