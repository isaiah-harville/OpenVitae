import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const destinations = [
  ".svelte-kit/output/client/_app/immutable/assets/files",
  "build/client/_app/immutable/assets/files",
];
for (const destination of destinations) mkdirSync(destination, { recursive: true });
for (const family of ["inter", "jetbrains-mono"]) {
  for (const weight of [400, 500, 600, 700]) {
    for (const extension of ["woff", "woff2"]) {
      const name = `${family}-latin-${weight}-normal.${extension}`;
      for (const destination of destinations) {
        copyFileSync(
          join("node_modules", "@fontsource", family, "files", name),
          join(destination, name),
        );
      }
    }
  }
}
