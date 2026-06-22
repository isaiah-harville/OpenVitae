// Named palettes. The actual colors live in app/globals.css as CSS variables keyed by
// `[data-palette="<id>"]` (with `.dark[data-palette="<id>"]` variants), so each palette
// looks right in both light and dark mode. This module is just the registry the admin
// UI renders, plus the shape we persist in SiteConfig.theme.

export type Palette = { id: string; name: string; swatch: string };

export const DEFAULT_PALETTE = "neutral";

export const PALETTES: Palette[] = [
  { id: "neutral", name: "Neutral", swatch: "#404040" },
  { id: "blue", name: "Blue", swatch: "#2563eb" },
  { id: "violet", name: "Violet", swatch: "#7c3aed" },
  { id: "rose", name: "Rose", swatch: "#e11d48" },
  { id: "red", name: "Red", swatch: "#dc2626" },
  { id: "orange", name: "Orange", swatch: "#ea580c" },
  { id: "green", name: "Green", swatch: "#16a34a" },
  { id: "teal", name: "Teal", swatch: "#0d9488" },
];

export type ThemeConfig = {
  palette?: string;
  // Optional advanced override: a custom accent (hex). When set, it overrides the
  // palette's primary color via an inline style on <html>.
  customPrimary?: string;
  // Default color mode for first-time visitors.
  defaultMode?: "light" | "dark" | "system";
  // Public homepage layout: "linear" stacks sections; "pages" shows them as tabs.
  layout?: "linear" | "pages";
};

export const DEFAULT_LAYOUT: "linear" | "pages" = "linear";

export function paletteName(id: string | undefined): string {
  return PALETTES.find((p) => p.id === id)?.name ?? "Neutral";
}
