import {getModeConfig, getStageCount, getStageCountForMode, type GameModeId} from "./game-mode";

//* Qui decidi la mappa di ogni stage.

//* numberColor colora il numero sul pulsante del livello.

//* Sfondo/strada/blocchi: bg_* / road_* / block_* in stage-scenery-assets.ts.

//* Se gli stage finiscono, si ricomincia dal primo.

//* true: ogni partita toglie il 20% del cuore a spicchio, su 360°.

//* false: lo toglie da destra verso sinistra.

export const DRAIN_FILL_IN_CIRCLE = true;

//* Livelli e numero di stage dipendono dalla modalità (game-mode.ts)
export const getStageLevels = (stageIndex?: number): number => {
  const config = getModeConfig();

  if (stageIndex == null) return config.stageLevels;

  const idx = normalizeStageIndex(stageIndex);
  const count = getStageCount();

  if (config.finalStageLevels != null && count > 0 && idx === count - 1) {
    return config.finalStageLevels;
  }

  return config.stageLevels;
};

const stageLevelOffset = (stageIndex: number): number => {
  const count = getStageCount();

  if (count <= 0) return 0;

  let sum = 0;
  const target = normalizeStageIndex(stageIndex);

  for (let i = 0; i < target; i++) {
    sum += getStageLevels(i);
  }

  return sum;
};

export {getStageCount};

export type StageMapConfig = {
  levels: number;

  numberColor: string;
};

const PATH_COLORS = [
  "#ffe566",

  "#7ecbff",

  "#ff8ec8",

  "#7dffa8",

  "#ffb15a",

  "#d2a6ff",

  "#ff7a7a",

  "#6ee7d9",

  "#c4f080",

  "#ffa07a",

  "#87cefa",

  "#dda0dd",

  "#f0e68c",

  "#98fb98",

  "#ffb6c1",

  "#20b2aa",

  "#e9967a",

  "#9370db",
] as const;

export const normalizeStageIndexForMode = (
  stageIndex: number,
  mode: GameModeId,
): number => {
  const count = getStageCountForMode(mode);

  if (count <= 0) return 0;

  return ((Math.floor(stageIndex) % count) + count) % count;
};

export const normalizeStageIndex = (stageIndex: number): number => {
  const count = getStageCount();

  if (count <= 0) return 0;

  return ((Math.floor(stageIndex) % count) + count) % count;
};

export const getStageMap = (stageIndex: number): StageMapConfig => ({
  levels: getStageLevels(stageIndex),

  numberColor: PATH_COLORS[normalizeStageIndex(stageIndex)] ?? PATH_COLORS[0],
});

//* Numero globale mostrato sulla mappa (50 per stage OT; 300 sul finale).

export const getStageLevelNumber = (
  stageIndex: number,
  localIndex: number,
): number => stageLevelOffset(stageIndex) + localIndex + 1;

export const hexToInt = (hex: string): number => {
  const value = Number.parseInt(hex.trim().replace("#", ""), 16);

  return Number.isFinite(value) ? value : 0xffe566;
};

export const darkenHex = (hex: string, amount = 0.62): string => {
  const color = hexToInt(hex);

  const scale = 1 - amount;

  const channel = (shift: number) =>
    Math.round(((color >> shift) & 0xff) * scale);

  const mixed = (channel(16) << 16) | (channel(8) << 8) | channel(0);

  return `#${mixed.toString(16).padStart(6, "0")}`;
};
