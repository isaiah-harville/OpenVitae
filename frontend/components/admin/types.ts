import type { SiteConfig } from "@/lib/api";

export type EditorProps = {
  config: SiteConfig;
  setConfig: (c: SiteConfig) => void;
};

export type ReloadProps = {
  reload: () => Promise<void>;
};
