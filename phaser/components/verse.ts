import type {Language} from "@/language";
import {getCurrentLanguage} from "@/language";
import {getStageLevelNumber, STAGE_LEVELS} from "@/settings/stage-map";
import {resolveLocalizedVerse, type LocalizedVerseFields} from "@/settings/stage-verse-i18n";
import {STAGE_VERSE_TRANSLATIONS} from "@/settings/stage-verse-translations.generated";
import {STAGE_VERSE_SETS, type LevelVerse} from "@/settings/stage-verses";

export type Verse = {
  level: number;
  text: string;
  reference: string;
};

const FALLBACK_FIELDS: LocalizedVerseFields & {level: number} = {
  level: 12,
  text: {
    it: "“Perché nulla è impossibile a Dio.”",
    en: "“For nothing is impossible with God.”",
    es: "“Porque nada es imposible para Dios.”",
    fr: "« Rien n'est impossible à Dieu. »",
  },
  reference: {
    it: "Luca 1,37",
    en: "Luke 1:37",
    es: "Lucas 1,37",
    fr: "Luc 1,37",
  },
};

const mergeVerseFields = (entry: LevelVerse): LocalizedVerseFields & {level: number} => {
  const overlay = STAGE_VERSE_TRANSLATIONS[entry.level];

  return {
    level: entry.level,
    text: {...entry.text, ...overlay?.text},
    reference: {...entry.reference},
  };
};

const findVerseEntry = (stage: number, localLevel: number): LevelVerse | undefined => {
  const set = STAGE_VERSE_SETS.find((s) => s.stage === stage);
  const index = localLevel - 1;

  if (!set || index < 0 || index >= set.levels.length) return undefined;

  return set.levels[index];
};

/** `stage` = stage di gioco (1-based); `localLevel` = bottone 1–20 sulla mappa. */
export const getVerseByStageAndLevel = (
  stage: number,
  localLevel: number,
  language: Language = getCurrentLanguage(),
): Verse => {
  const stageNum = Math.max(1, Math.floor(stage));
  const local = Math.max(1, Math.min(STAGE_LEVELS, Math.floor(localLevel)));
  const globalLevel = getStageLevelNumber(stageNum - 1, local - 1);
  const entry = findVerseEntry(stageNum, local);

  if (!entry) {
    return resolveLocalizedVerse({...FALLBACK_FIELDS, level: globalLevel}, language);
  }

  return resolveLocalizedVerse({...mergeVerseFields(entry), level: globalLevel}, language);
};

/** @deprecated Usa getVerseByStageAndLevel */
export const getVerseByStage = (stage: number): Verse =>
  getVerseByStageAndLevel(stage, 1);
