import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const checkpointPath = path.join(root, "scripts/.stage-verse-translations.partial.json");
const outPath = path.join(root, "src/settings/stage-verse-translations.generated.ts");

const byLevel = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
const levels = Object.keys(byLevel)
  .map(Number)
  .sort((a, b) => a - b);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateWithGoogle(text, targetLang) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "it");
  url.searchParams.set("tl", targetLang);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  for (let attempt = 1; attempt <= 8; attempt++) {
    const res = await fetch(url, {signal: AbortSignal.timeout(20_000)});

    if (res.status === 429) {
      await sleep(4000 * attempt);
      continue;
    }

    if (!res.ok) {
      throw new Error(`Google ${targetLang} HTTP ${res.status}`);
    }

    const data = await res.json();

    return data[0]?.map((row) => row[0]).join("") ?? text;
  }

  throw new Error(`Google failed (${targetLang})`);
}

async function translateChunk(text, targetLang) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `it|${targetLang}`);

  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {signal: AbortSignal.timeout(20_000)});

    if (res.status === 429) {
      await sleep(3000 * attempt);
      continue;
    }

    if (!res.ok) {
      throw new Error(`MyMemory ${targetLang} HTTP ${res.status}`);
    }

    const data = await res.json();
    const translated = data.responseData?.translatedText;

    if (translated) return translated;

    await sleep(1500 * attempt);
  }

  return translateWithGoogle(text, targetLang);
}

async function translate(text, targetLang) {
  if (text.length <= 420) {
    return translateChunk(text, targetLang);
  }

  const parts = text.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) ?? [text];
  const chunks = [];
  let buffer = "";

  for (const part of parts) {
    if (`${buffer}${part}`.length > 420 && buffer) {
      chunks.push(buffer.trim());
      buffer = part;
    } else {
      buffer += part;
    }
  }

  if (buffer.trim()) chunks.push(buffer.trim());

  const translated = [];

  for (const chunk of chunks) {
    translated.push(await translateChunk(chunk, targetLang));
    await sleep(350);
  }

  return translated.join(" ");
}

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

for (const lang of ["es", "fr"]) {
  console.log(`Filling ${lang}…`);
  let done = 0;

  for (const level of levels) {
    if (byLevel[level].text[lang]) {
      done++;
      continue;
    }

    try {
      byLevel[level].text[lang] = await translate(byLevel[level].text.it, lang);
    } catch (error) {
      console.warn(`  ${lang} level ${level}: ${error.message}`);
    }

    done++;

    if (done % 10 === 0) {
      fs.writeFileSync(checkpointPath, JSON.stringify(byLevel));
      writeOutput();
      console.log(`  ${lang}: ${done}/${levels.length}`);
    }

    await sleep(900);
  }

  fs.writeFileSync(checkpointPath, JSON.stringify(byLevel));
  writeOutput();
  console.log(`  ${lang}: done`);
}

writeOutput();
console.log(`Wrote ${outPath}`);
