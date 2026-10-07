import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const checkpointPath = path.join(root, "scripts/.stage-verse-translations.partial.json");
const outPath = path.join(root, "src/settings/stage-verse-translations.generated.ts");

const byLevel = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));

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
