import {getStageMap} from "./stage-map";

const STORAGE_KEY = "holy-crush-cleared";

type Progress = {
  stage: number;
  cleared: number;
};

const emptyProgress = (): Progress => ({stage: 0, cleared: 0});

const readProgress = (): Progress => {
  if (typeof window === "undefined") return emptyProgress();

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return emptyProgress();

  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as Partial<Progress>;
      const stageValue = Number(parsed.stage);
      const stage = Number.isFinite(stageValue) ? Math.max(0, Math.floor(stageValue)) : 0;
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

//* Indice file: op_0, backgroundStage_0, road_0
export const getStageIndex = (): number => readProgress().stage;

//* Quanti play sono aperti sullo stage corrente
export const getUnlockedCount = (): number => {
  const progress = readProgress();

  return Math.min(getStageMap(progress.stage).levels, progress.cleared + 1);
};

//* true quando questa vittoria chiude lo stage e si passa al successivo.
//* Si avanza solo battendo il livello più avanti già aperto, non ripetendone uno vecchio.
export const registerWin = (level?: number): boolean => {
  const progress = readProgress();
  const frontier = progress.cleared + 1;
  const played = level && level > 0 ? Math.floor(level) : frontier;

  if (played !== frontier) return false;

  if (frontier >= getStageMap(progress.stage).levels) {
    writeProgress({stage: progress.stage + 1, cleared: 0});

    return true;
  }

  writeProgress({...progress, cleared: frontier});

  return false;
};
