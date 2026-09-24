import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dist = join(import.meta.dir, "dist");
mkdirSync(dist, { recursive: true });

const entries = [
  ["src/content/tasks-hook.ts", "tasks-hook.js"],
  ["src/content/rise.ts", "rise.js"],
  ["src/content/forms.ts", "forms.js"],
  ["src/background.ts", "background.js"],
  ["src/options/options.ts", "options.js"],
] as const;

for (const [entry, outfile] of entries) {
  const result = await Bun.build({
    entrypoints: [join(import.meta.dir, entry)],
    outdir: dist,
    target: "browser",
    minify: true,
    naming: outfile,
    // The page-world hook must not leak top-level bindings onto window.
    format: outfile === "tasks-hook.js" ? "iife" : undefined,
  });

  if (!result.success) {
    console.error(result.logs);
    process.exit(1);
  }
}

cpSync(join(import.meta.dir, "manifest.json"), join(dist, "manifest.json"));
cpSync(
  join(import.meta.dir, "src/options/index.html"),
  join(dist, "options.html"),
);
cpSync(
  join(import.meta.dir, "src/options/options.css"),
  join(dist, "options.css"),
);

console.log("extension built → apps/extension/dist");
