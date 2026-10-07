import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const versesPath = path.join(root, "src/settings/stage-verses.ts");
const outPath = path.join(root, "src/settings/stage-verse-translations.generated.ts");
const checkpointPath = path.join(root, "scripts/.stage-verse-translations.partial.json");

const src = fs.readFileSync(versesPath, "utf8");

const entryRe =
  /level:\s*(\d+),\s*reference:\s*\{\s*it:\s*"((?:[^"\\]|\\.)*)"\s*\},\s*text:\s*\{\s*it:\s*"((?:[^"\\]|\\.)*)"\s*\}/gs;

const entries = [];

for (const match of src.matchAll(entryRe)) {
  entries.push({
    level: Number(match[1]),
    referenceIt: match[2],
    textIt: match[3],
  });
}

if (entries.length === 0) {
  console.error("No verses parsed — run migrate-stage-verses-i18n.mjs first");
  process.exit(1);
}

console.log(`Parsed ${entries.length} verses`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateText(text, targetLang) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "it");
  url.searchParams.set("tl", targetLang);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  let lastError;

  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const res = await fetch(url);

      if (res.status === 429) {
        await sleep(2500 * attempt);
        throw new Error("HTTP 429");
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const translated = data[0]?.map((row) => row[0]).join("") ?? text;

      return translated;
    } catch (error) {
      lastError = error;
      await sleep(400 * attempt);
    }
  }

  throw lastError ?? new Error(`Translate failed (${targetLang})`);
}

const targets = ["en", "es", "fr"];
const byLevel = fs.existsSync(checkpointPath)
  ? JSON.parse(fs.readFileSync(checkpointPath, "utf8"))
  : {};

for (const entry of entries) {
  if (!byLevel[entry.level]) {
    byLevel[entry.level] = {text: {it: entry.textIt}};
  }
}

const saveCheckpoint = () => {
  fs.writeFileSync(checkpointPath, JSON.stringify(byLevel));
};

const writeOutput = () => {
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
};

for (const lang of targets) {
  console.log(`Translating → ${lang}…`);
  let index = 0;

  for (const entry of entries) {
    index++;

    if (byLevel[entry.level].text[lang]) {
      continue;
    }

    const text = await translateText(entry.textIt, lang);

    byLevel[entry.level].text[lang] = text;

    if (index % 10 === 0 || index === entries.length) {
      saveCheckpoint();
      writeOutput();
      console.log(`  ${lang}: ${index}/${entries.length}`);
    }

    await sleep(280);
  }

  saveCheckpoint();
  writeOutput();
  console.log(`  ${lang}: done`);
}

writeOutput();
console.log(`Wrote ${outPath}`);
