// Named palettes. Colors live in app.css; this registry drives the admin picker.

export type Palette = { id: string; name: string; swatch: string };

export const DEFAULT_PALETTE = "neutral";

export const PALETTES: Palette[] = [
  { id: "neutral", name: "Black", swatch: "#171717" },
  { id: "blue", name: "Blue", swatch: "#2563eb" },
  { id: "violet", name: "Violet", swatch: "#7c3aed" },
  { id: "rose", name: "Rose", swatch: "#e11d48" },
  { id: "red", name: "Red", swatch: "#dc2626" },
  { id: "orange", name: "Orange", swatch: "#ea580c" },
  { id: "green", name: "Green", swatch: "#16a34a" },
  { id: "teal", name: "Teal", swatch: "#0f766e" },
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
  return PALETTES.find((p) => p.id === id)?.name ?? "Black";
}
