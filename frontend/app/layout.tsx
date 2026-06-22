import type { Metadata } from "next";
import "./globals.css";
import { getSiteConfig } from "@/lib/api";

export const metadata: Metadata = {
  title: "OpenVitae",
  description: "Config-driven CV website and publication manager",
};

const VAR_MAP: Record<string, string> = {
  primary: "--ov-primary",
  secondary: "--ov-secondary",
  accent: "--ov-accent",
  background: "--ov-background",
  text: "--ov-text",
  font: "--ov-font",
};

function themeStyle(theme: Record<string, string>): string {
  const lines = Object.entries(theme)
    .filter(([k]) => VAR_MAP[k])
    .map(([k, v]) => `${VAR_MAP[k]}: ${v};`);
  return `:root{${lines.join("")}}`;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let css = "";
  try {
    const config = await getSiteConfig();
    css = themeStyle(config.theme || {});
  } catch {
    // Backend unavailable — fall back to the defaults in globals.css.
  }
  return (
    <html lang="en">
      <head>{css && <style dangerouslySetInnerHTML={{ __html: css }} />}</head>
      <body>{children}</body>
    </html>
  );
}
