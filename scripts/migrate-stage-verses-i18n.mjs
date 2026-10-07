import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const versesPath = path.join(root, "src/settings/stage-verses.ts");
let src = fs.readFileSync(versesPath, "utf8");

if (src.includes("LocalizedVerseFields")) {
  console.log("stage-verses.ts already migrated");
  process.exit(0);
}

src = src.replace(
  `export type LevelVerse = {
  /** Numero livello globale: stage 1 → 1–20, stage 2 → 21–40, … */
  level: number;
  text: string;
  reference: string;
};`,
  `import type {LocalizedVerseFields} from "./stage-verse-i18n";

export type LevelVerse = LocalizedVerseFields & {
  /** Numero livello globale: stage 1 → 1–20, stage 2 → 21–40, … */
  level: number;
};`,
);

src = src.replace(
  /reference:\s*"((?:[^"\\]|\\.)*)"\s*,\s*\n\s*text:\s*"((?:[^"\\]|\\.)*)"/gs,
  (_, reference, text) =>
    `reference: { it: ${JSON.stringify(reference)} },\n        text: { it: ${JSON.stringify(text)} }`,
);

fs.writeFileSync(versesPath, src);
console.log("Migrated stage-verses.ts to localized Italian fields");
