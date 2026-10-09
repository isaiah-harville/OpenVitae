export const BLOCK_TYPES = [
  "hero",
  "about",
  "text",
  "image",
  "imageText",
  "custom",
  "skills",
  "publications",
  "projects",
  "talks",
  "contact",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
export type PageBlock = {
  id: string;
  type: BlockType;
  width: 1 | 2;
  heading: string;
  eyebrow: string;
  text: string;
  imageKey?: string;
  imageUrl?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  buttonLabel?: string;
  buttonUrl?: string;
};
export type SitePage = {
  id: string;
  slug: string;
  title: string;
  inNav: boolean;
  blocks: PageBlock[];
};
export type PageDocument = { version: 1; pages: SitePage[] };

const defaults: Record<BlockType, Pick<PageBlock, "heading" | "eyebrow" | "text" | "width">> = {
  hero: { heading: "", eyebrow: "Hello, I'm", text: "", width: 2 },
  about: { heading: "A little about me", eyebrow: "The story", text: "", width: 2 },
  text: { heading: "Your heading", eyebrow: "", text: "Add your story here.", width: 1 },
  image: { heading: "", eyebrow: "", text: "", width: 1 },
  imageText: { heading: "Your heading", eyebrow: "", text: "Add your story here.", width: 2 },
  custom: { heading: "Your heading", eyebrow: "", text: "Add your story here.", width: 1 },
  skills: { heading: "Tools & expertise", eyebrow: "Skills", text: "", width: 1 },
  publications: {
    heading: "Selected publications",
    eyebrow: "Research",
    text: "Ideas, findings, and work shared with the world.",
    width: 2,
  },
  projects: { heading: "Projects & experiments", eyebrow: "Selected work", text: "", width: 2 },
  talks: { heading: "Talks & appearances", eyebrow: "On stage", text: "", width: 2 },
  contact: {
    heading: "Have something in mind? Let's talk.",
    eyebrow: "Let's connect",
    text: "",
    width: 2,
  },
};

export function createBlock(type: BlockType): PageBlock {
  return { id: crypto.randomUUID(), type, ...defaults[type] };
}

export function defaultPages(
  features: Record<string, boolean> = {},
  content?: {
    skills: number;
    projects: number;
    talks: number;
    hasBio: boolean;
    hasContact: boolean;
  },
): PageDocument {
  const types: BlockType[] = [
    "hero",
    "about",
    "skills",
    "publications",
    "projects",
    "talks",
    "contact",
  ];
  const visible = (type: BlockType) => {
    if (features[type] === false) return false;
    if (!content) return type !== "skills";
    if (type === "about") return content.hasBio || content.skills > 0;
    if (type === "skills") return content.skills > 0;
    if (type === "projects" || type === "talks") return content[type] > 0;
    if (type === "contact") return content.hasContact;
    return true;
  };
  return {
    version: 1,
    pages: [
      {
        id: "home",
        slug: "home",
        title: "Home",
        inNav: true,
        blocks: types.filter(visible).map(createBlock),
      },
    ],
  };
}

export function reservedSlug(slug: string): boolean {
  return (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    ["admin", "api", "projects", "publications", "home", "healthz"].includes(slug)
  );
}

export function pagePath(slug: string): string {
  return slug === "home" ? "/" : `/${slug}`;
}

export function moveBlock<T>(items: T[], item: T, delta: number): T[] {
  const index = items.indexOf(item);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= items.length) return items;
  const result = [...items];
  result.splice(index, 1);
  result.splice(next, 0, item);
  return result;
}
