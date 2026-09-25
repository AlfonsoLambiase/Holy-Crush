const STORAGE_KEY = "holy-crush-cleared";
export const LEVEL_COUNT = 5;

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
      const stage = Number(parsed.stage);
      const cleared = Number(parsed.cleared);

      return {
        stage: Number.isFinite(stage) ? Math.max(0, Math.floor(stage)) : 0,
        cleared: Number.isFinite(cleared)
          ? Math.min(LEVEL_COUNT, Math.max(0, Math.floor(cleared)))
          : 0,
      };
    } catch {
      return emptyProgress();
    }
  }

  const cleared = Number(raw);

  return {
    stage: 0,
    cleared: Number.isFinite(cleared) ? Math.min(LEVEL_COUNT, Math.max(0, Math.floor(cleared))) : 0,
  };
};

const writeProgress = (progress: Progress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

//* Indice file: op_0, backgroundStage_0, road_0
export const getStageIndex = (): number => readProgress().stage;

//* Quanti play sono aperti sullo stage corrente
export const getUnlockedCount = (): number =>
  Math.min(LEVEL_COUNT, readProgress().cleared + 1);

//* true quando questa vittoria chiude lo stage e si passa al successivo
export const registerWin = (): boolean => {
  const progress = readProgress();
  const cleared = progress.cleared + 1;

  if (cleared >= LEVEL_COUNT) {
    writeProgress({stage: progress.stage + 1, cleared: 0});

    return true;
  }

  writeProgress({...progress, cleared});

  return false;
};
