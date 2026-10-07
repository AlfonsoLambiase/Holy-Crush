import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outPath = path.join(root, "src/settings/stage-verse-translations.generated.ts");

const src = fs.readFileSync(outPath, "utf8");
const marker = "export const STAGE_VERSE_TRANSLATIONS: StageVerseTranslationMap = ";
const jsonStart = src.indexOf(marker) + marker.length;
const jsonEnd = src.indexOf("};", jsonStart);
const byLevel = JSON.parse(src.slice(jsonStart, jsonEnd + 1));

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
    if (!res.ok) throw new Error(`HTTP ${res.status} (${targetLang})`);
    const data = await res.json();
    return data[0]?.map((row) => row[0]).join("") ?? text;
  }
  throw new Error(`Translate failed (${targetLang})`);
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

const levels = Object.keys(byLevel)
  .map(Number)
  .sort((a, b) => a - b);

const jobs = [];
for (const level of levels) {
  const row = byLevel[level].text;
  if (!row.fr) jobs.push({level, lang: "fr"});
  if (!row.es) jobs.push({level, lang: "es"});
}

console.log(`Missing: ${jobs.length} (${jobs.filter((j) => j.lang === "fr").length} fr, ${jobs.filter((j) => j.lang === "es").length} es)`);

let done = 0;
for (const {level, lang} of jobs) {
  const it = byLevel[level].text.it;
  const translated = await translateText(it, lang);
  byLevel[level].text[lang] = translated;
  done++;
  if (done % 5 === 0 || done === jobs.length) {
    writeOutput();
    console.log(`  ${done}/${jobs.length}`);
  }
  await sleep(250);
}

writeOutput();
console.log("Done.");
