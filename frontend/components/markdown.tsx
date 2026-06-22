import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

// Allow the presentational HTML common in GitHub profile READMEs (centered divs,
// shields.io <img> badges, <sub>, etc.) while sanitizing away scripts, event
// handlers, and javascript: URLs. Safe because the bio is authored by the admin,
// and sanitize blocks injection regardless.
const schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "div",
    "span",
    "sub",
    "sup",
    "br",
    "img",
    "picture",
    "source",
    "details",
    "summary",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "align", "style"],
    img: [...(defaultSchema.attributes?.img ?? []), "width", "height", "align", "loading"],
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
  },
};

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert prose-headings:tracking-tight prose-a:font-medium prose-a:text-primary prose-a:no-underline hover:prose-a:underline [&_img]:my-1 [&_img]:inline-block ${className ?? ""}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
