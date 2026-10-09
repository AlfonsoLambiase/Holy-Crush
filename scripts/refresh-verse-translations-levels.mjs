import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const versesPath = path.join(root, "src/settings/stage-verses.ts");
const outPath = path.join(root, "src/settings/stage-verse-translations.generated.ts");
const checkpointPath = path.join(root, "scripts/.stage-verse-translations.partial.json");

const levelsArg = process.argv.slice(2).map(Number).filter(Boolean);
if (levelsArg.length === 0) {
  console.error("Usage: node refresh-verse-translations-levels.mjs 8 41 ...");
  process.exit(1);
}

const levelSet = new Set(levelsArg);
const src = fs.readFileSync(versesPath, "utf8");
const entryRe =
  /level:\s*(\d+),\s*reference:\s*\{\s*it:\s*"((?:[^"\\]|\\.)*)"\s*\},\s*text:\s*\{\s*it:\s*"((?:[^"\\]|\\.)*)"\s*\}/gs;

const itByLevel = new Map();
for (const match of src.matchAll(entryRe)) {
  const level = Number(match[1]);
  if (levelSet.has(level)) {
    itByLevel.set(level, match[3]);
  }
}

for (const level of levelSet) {
  if (!itByLevel.has(level)) {
    console.error(`Level ${level} not found in stage-verses.ts`);
    process.exit(1);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateText(text, targetLang) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "it");
  url.searchParams.set("tl", targetLang);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  for (let attempt = 1; attempt <= 10; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await sleep(2500 * attempt);
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} (${targetLang})`);
    }
    const data = await res.json();
    return data[0]?.map((row) => row[0]).join("") ?? text;
  }
  throw new Error(`Translate failed (${targetLang})`);
}

const byLevel = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));

for (const level of [...levelSet].sort((a, b) => a - b)) {
  const it = itByLevel.get(level);
  byLevel[String(level)] = { text: { it } };
  console.log(`Level ${level}: IT updated`);
}

const targets = ["en", "es", "fr"];
for (const lang of targets) {
  console.log(`Translating ${lang}…`);
  for (const level of [...levelSet].sort((a, b) => a - b)) {
    const it = byLevel[String(level)].text.it;
    byLevel[String(level)].text[lang] = await translateText(it, lang);
    console.log(`  ${level}/${lang}`);
    await sleep(280);
  }
}

fs.writeFileSync(checkpointPath, JSON.stringify(byLevel));

const fileBody = `/* eslint-disable */
/** Generato da scripts/generate-stage-verse-translations.mjs — non modificare a mano. */
import type {Language} from "@/language";

export type StageVerseTranslationMap = Record<
  number,
  {
    text: Partial<Record<Language, string>> & {it: string};
  }
>;

export const STAGE_VERSE_TRANSLATIONS: StageVerseTranslationMap = ${JSON.stringify(byLevel, null, 2)};
`;

fs.writeFileSync(outPath, fileBody);
console.log(`Wrote ${outPath}`);
