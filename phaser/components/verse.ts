import {getStageLevelNumber, STAGE_LEVELS} from "@/settings/stage-map";
import {STAGE_VERSE_SETS, type LevelVerse} from "@/settings/stage-verses";

export type Verse = LevelVerse;

const FALLBACK: Verse = {
  level: 12,
  text: "“Perché nulla è impossibile a Dio.”",
  reference: "Luca 1,37",
};

const findVerseEntry = (stage: number, localLevel: number): LevelVerse | undefined => {
  const set = STAGE_VERSE_SETS.find((s) => s.stage === stage);
  const index = localLevel - 1;

  if (!set || index < 0 || index >= set.levels.length) return undefined;

  return set.levels[index];
};

/** `stage` = stage di gioco (1-based); `localLevel` = bottone 1–20 sulla mappa. */
export const getVerseByStageAndLevel = (stage: number, localLevel: number): Verse => {
  const stageNum = Math.max(1, Math.floor(stage));
  const local = Math.max(1, Math.min(STAGE_LEVELS, Math.floor(localLevel)));
  const globalLevel = getStageLevelNumber(stageNum - 1, local - 1);
  const entry = findVerseEntry(stageNum, local);

  if (!entry) return {...FALLBACK, level: globalLevel};

  return {
    ...entry,
    level: globalLevel,
  };
};

/** @deprecated Usa getVerseByStageAndLevel */
export const getVerseByStage = (stage: number): Verse =>
  getVerseByStageAndLevel(stage, 1);
