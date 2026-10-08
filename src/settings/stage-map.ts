//* Qui decidi la mappa di ogni stage.

//* numberColor colora il numero sul pulsante del livello.

//* Sfondo/strada/blocchi: bg_* / road_* / block_* in stage-scenery-assets.ts.

//* Se gli stage finiscono, si ricomincia dal primo.

//* true: ogni partita toglie il 20% del cuore a spicchio, su 360°.

//* false: lo toglie da destra verso sinistra.

export const DRAIN_FILL_IN_CIRCLE = true;

export const STAGE_LEVELS = 20;

//* Stage di contenuto (op_0 … op_19 + set scenery tematici)

export const STAGE_COUNT = 20;

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

export const STAGE_MAPS: StageMapConfig[] = Array.from(
  { length: STAGE_COUNT },
  (_, index) => ({
    levels: STAGE_LEVELS,

    numberColor: PATH_COLORS[index] ?? PATH_COLORS[0],
  }),
);

export const normalizeStageIndex = (stageIndex: number): number => {
  if (STAGE_COUNT <= 0) return 0;

  return ((Math.floor(stageIndex) % STAGE_COUNT) + STAGE_COUNT) % STAGE_COUNT;
};

export const getStageMap = (stageIndex: number): StageMapConfig =>
  STAGE_MAPS[normalizeStageIndex(stageIndex)];

//* 1-20 sul primo stage, 21-40 sul secondo, e così via

export const getStageLevelNumber = (
  stageIndex: number,
  localIndex: number,
): number =>
  Math.max(0, normalizeStageIndex(stageIndex)) * STAGE_LEVELS + localIndex + 1;

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
