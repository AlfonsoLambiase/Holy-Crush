import {type GameModeId, getGameMode, getModeConfig, getModeConfigForMode, getStageCountForMode} from "./game-mode";
import {notifyLevelWon, notifyLocalSave} from "./local-save-signal";
import {getStageCount, getStageMap, normalizeStageIndexForMode} from "./stage-map";
import {getWorldCount, getWorldStageRange} from "./world-map";

//* Ogni modalità ha il suo progresso
export const progressStorageKey = (): string => getModeConfig().progressKey;

export type StageProgress = {
  stage: number;
  cleared: number;
};

const emptyProgress = (): StageProgress => ({stage: 0, cleared: 0});

const levelsFor = (mode: GameModeId, stage: number): number => {
  const config = getModeConfigForMode(mode);
  const count = getStageCountForMode(mode);

  if (config.finalStageLevels != null && count > 0 && stage === count - 1) {
    return config.finalStageLevels;
  }

  return config.stageLevels;
};

export const normalizeStageProgress = (
  mode: GameModeId,
  stageValue: number,
  clearedValue: number,
): StageProgress => clampProgress(mode, stageValue, clearedValue);

const clampProgress = (mode: GameModeId, stageValue: number, clearedValue: number): StageProgress => {
  const stage = Number.isFinite(stageValue)
    ? normalizeStageIndexForMode(Math.max(0, Math.floor(stageValue)), mode)
    : 0;
  const cleared = Number.isFinite(clearedValue)
    ? Math.min(levelsFor(mode, stage), Math.max(0, Math.floor(clearedValue)))
    : 0;

  return {stage, cleared};
};

export const readProgressForMode = (mode: GameModeId): StageProgress => {
  if (typeof window === "undefined") return emptyProgress();

  const raw = localStorage.getItem(getModeConfigForMode(mode).progressKey);

  if (!raw) return emptyProgress();

  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as Partial<StageProgress>;

      return clampProgress(mode, Number(parsed.stage), Number(parsed.cleared));
    } catch {
      return emptyProgress();
    }
  }

  return clampProgress(mode, 0, Number(raw));
};

export const writeProgressForMode = (mode: GameModeId, progress: StageProgress): void => {
  if (typeof window === "undefined") return;

  const next = clampProgress(mode, progress.stage, progress.cleared);

  localStorage.setItem(getModeConfigForMode(mode).progressKey, JSON.stringify(next));
  notifyLocalSave();
};

const readProgress = (): StageProgress => readProgressForMode(getGameMode());

const writeProgress = (progress: StageProgress) => {
  writeProgressForMode(getGameMode(), progress);
};

//* Indice file opening: op_0 …; scenery: stage-scenery-assets.ts
export const getStageIndex = (): number => readProgress().stage;

//* Quanti play sono aperti sullo stage corrente
export const getUnlockedCount = (): number => {
  const progress = readProgress();

  return Math.min(getStageMap(progress.stage).levels, progress.cleared + 1);
};

export const getClearedCount = (): number => readProgress().cleared;

/** Opening narrativo solo finché non hai ancora completato il livello 1 dello stage. */
export const shouldPlayStageOpening = (): boolean => getClearedCount() === 0;

export const isWorldComplete = (worldIndex: number): boolean => {
  if (worldIndex < 0 || worldIndex >= getWorldCount()) return false;

  const {last} = getWorldStageRange(worldIndex);

  return getStageIndex() > last;
};

export const isWorldUnlocked = (worldIndex: number): boolean => {
  if (worldIndex <= 0) return true;

  return isWorldComplete(worldIndex - 1);
};

/** Allinea lo stage salvato al mondo scelto (progresso in corso o replay dal primo stage del mondo). */
export const prepareEnterWorld = (worldIndex: number): void => {
  if (!isWorldUnlocked(worldIndex)) return;

  const {first, last} = getWorldStageRange(worldIndex);
  const current = getStageIndex();

  if (current >= first && current <= last) return;

  writeProgress({stage: first, cleared: 0});
};

export type RegisterWinResult = "none" | "level" | "stage";

//* Si avanza solo battendo il livello più avanti già aperto, non ripetendone uno vecchio.
export const registerWin = (level?: number): RegisterWinResult => {
  const progress = readProgress();
  const frontier = progress.cleared + 1;
  const played = level && level > 0 ? Math.floor(level) : frontier;

  if (played !== frontier) return "none";

  if (frontier >= getStageMap(progress.stage).levels) {
    const nextStage = progress.stage + 1;

    writeProgress({
      stage: nextStage >= getStageCount() ? 0 : nextStage,
      cleared: 0,
    });
    notifyLevelWon();

    return "stage";
  }

  writeProgress({...progress, cleared: frontier});
  notifyLevelWon();

  return "level";
};
