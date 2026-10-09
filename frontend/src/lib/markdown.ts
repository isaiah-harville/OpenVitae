import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export function markdown(source: string): string {
  return sanitizeHtml(marked.parse(source, { async: false }) as string, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}
