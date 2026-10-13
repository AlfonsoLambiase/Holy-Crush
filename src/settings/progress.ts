import {getModeConfig} from "./game-mode";
import {getStageCount, getStageMap, normalizeStageIndex} from "./stage-map";
import {getWorldCount, getWorldStageRange} from "./world-map";

//* Ogni modalità ha il suo progresso
export const progressStorageKey = (): string => getModeConfig().progressKey;

type Progress = {
  stage: number;
  cleared: number;
};

const emptyProgress = (): Progress => ({stage: 0, cleared: 0});

const readProgress = (): Progress => {
  if (typeof window === "undefined") return emptyProgress();

  const raw = localStorage.getItem(progressStorageKey());

  if (!raw) return emptyProgress();

  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as Partial<Progress>;
      const stageValue = Number(parsed.stage);
      const stage = Number.isFinite(stageValue)
        ? normalizeStageIndex(Math.max(0, Math.floor(stageValue)))
        : 0;
      const cleared = Number(parsed.cleared);

      return {
        stage,
        cleared: Number.isFinite(cleared)
          ? Math.min(getStageMap(stage).levels, Math.max(0, Math.floor(cleared)))
          : 0,
      };
    } catch {
      return emptyProgress();
    }
  }

  const cleared = Number(raw);

  return {
    stage: 0,
    cleared: Number.isFinite(cleared) ? Math.min(getStageMap(0).levels, Math.max(0, Math.floor(cleared))) : 0,
  };
};

const writeProgress = (progress: Progress) => {
  localStorage.setItem(progressStorageKey(), JSON.stringify(progress));
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

    return "stage";
  }

  writeProgress({...progress, cleared: frontier});

  return "level";
};
