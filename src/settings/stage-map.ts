//* Qui decidi la mappa di ogni stage.
//* numberColor e pathColor vanno tenuti uguali: colorano il numero e il percorso.
//* Se gli stage finiscono, si ricomincia dal primo.

export type PathShape = "snake" | "mirror" | "wide" | "tight" | "drift" | "slow";

export type StageMapConfig = {
  levels: number;
  numberColor: string;
  pathColor: string;
  shape: PathShape;
  up: boolean;
};

export const STAGE_MAPS: StageMapConfig[] = [
  {levels: 10, numberColor: "#ffe566", pathColor: "#ffe566", shape: "snake", up: true},
  {levels: 10, numberColor: "#7ecbff", pathColor: "#7ecbff", shape: "mirror", up: true},
  {levels: 8, numberColor: "#ff8ec8", pathColor: "#ff8ec8", shape: "wide", up: false},
  {levels: 10, numberColor: "#7dffa8", pathColor: "#7dffa8", shape: "tight", up: true},
  {levels: 12, numberColor: "#ffb15a", pathColor: "#ffb15a", shape: "drift", up: true},
  {levels: 10, numberColor: "#d2a6ff", pathColor: "#d2a6ff", shape: "slow", up: false},
  {levels: 9, numberColor: "#ff7a7a", pathColor: "#ff7a7a", shape: "snake", up: true},
];

const PATH_BOTTOM = 0.86;
const PATH_TOP = 0.15;

export const getStageMap = (stageIndex: number): StageMapConfig => {
  const index = ((stageIndex % STAGE_MAPS.length) + STAGE_MAPS.length) % STAGE_MAPS.length;

  return STAGE_MAPS[index];
};

export const hexToInt = (hex: string): number => {
  const value = Number.parseInt(hex.trim().replace("#", ""), 16);

  return Number.isFinite(value) ? value : 0xffe566;
};

export const darkenHex = (hex: string, amount = 0.62): string => {
  const color = hexToInt(hex);
  const scale = 1 - amount;
  const channel = (shift: number) => Math.round(((color >> shift) & 0xff) * scale);
  const mixed = (channel(16) << 16) | (channel(8) << 8) | channel(0);

  return `#${mixed.toString(16).padStart(6, "0")}`;
};

//* Il seno extra è 0 sui livelli, così il bottone resta sul tracciato e l'onda sta in mezzo
const pathX = (shape: PathShape, t: number): number => {
  switch (shape) {
    case "mirror":
      return 0.5 - 0.2 * Math.cos(t * Math.PI) - 0.13 * Math.sin(t * Math.PI * 2);
    case "wide":
      return 0.5 + 0.3 * Math.cos(t * Math.PI) + 0.06 * Math.sin(t * Math.PI * 2);
    case "tight":
      return 0.5 + 0.18 * Math.cos(t * Math.PI) + 0.14 * Math.sin(t * Math.PI * 3);
    case "drift":
      return 0.5 + 0.22 * Math.cos(t * Math.PI + 0.8) + 0.1 * Math.sin(t * Math.PI * 2);
    case "slow":
      return 0.5 + 0.26 * Math.cos(t * Math.PI * 0.5) + 0.08 * Math.sin(t * Math.PI);
    default:
      return 0.5 + 0.2 * Math.cos(t * Math.PI) + 0.13 * Math.sin(t * Math.PI * 2);
  }
};

export const stagePoint = (config: StageMapConfig, t: number): {x: number; y: number} => {
  const span = Math.max(1, config.levels - 1);
  const along = t / span;
  const y = config.up
    ? PATH_BOTTOM - along * (PATH_BOTTOM - PATH_TOP)
    : PATH_TOP + along * (PATH_BOTTOM - PATH_TOP);

  return {x: pathX(config.shape, t), y};
};
