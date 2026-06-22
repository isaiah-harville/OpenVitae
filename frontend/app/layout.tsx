import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { CSSProperties } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSiteConfig } from "@/lib/api";
import { DEFAULT_PALETTE, type ThemeConfig } from "@/lib/palettes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "OpenVitae",
  description: "Config-driven CV website and publication manager",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let theme: ThemeConfig = {};
  try {
    const config = await getSiteConfig();
    theme = (config.theme as ThemeConfig) ?? {};
  } catch {
    // Backend unavailable — fall back to defaults.
  }

  const palette = theme.palette || DEFAULT_PALETTE;
  const defaultMode = theme.defaultMode || "system";
  const customStyle: CSSProperties | undefined = theme.customPrimary
    ? ({
        "--primary": theme.customPrimary,
        "--ring": theme.customPrimary,
        "--primary-foreground": "#ffffff",
      } as CSSProperties)
    : undefined;

  return (
    <html lang="en" data-palette={palette} style={customStyle} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultMode}
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
