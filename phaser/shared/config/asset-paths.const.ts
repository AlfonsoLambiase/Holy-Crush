//* Mappa i nomi logici degli asset sulle cartelle reali dentro /public
export const DEFAULT_STAGE = 1;

const UI_GAME_KEYS = new Set([
  "btnCancel",
  "btnConfirm",
  "btnExitGame",
  "btnExitGameBottom",
  "btnPlay",
  "btnPlayBlock",
  "btnRead",
  "btnReload",
  "btnTime",
  "popupExitGame",
  "containerScore",
]);

const STAGE_UI_KEYS = new Set([
  "backgroundGame",
  "backgroundScore",
  "backgroundGriglia",
  "block",
  "confetti_left",
  "confetti_right",
  "endBackground",
  "logo_stage",
  "iconSandClock",
  "iconHelp",
  "iconScore",
  "iconLive",
  "logoPhaser",
  "animLive",
  "animBrokenHeart",
]);

const STAGE_COMMON_KEYS = new Set(["bomb", "rocket", "obstacle_0", "obstacle_1"]);

//* Il file su disco non coincide col nome logico usato in gioco
const FILE_NAME: Record<string, string> = {
  endWin: "endWin_0",
  endFailed: "endFailed_0",
};

const folderFor = (key: string): string => {
  if (key === "starsEffect" || key === "sparklingStars") return "/effects";
  if (UI_GAME_KEYS.has(key)) return "/ui_game";
  if (STAGE_COMMON_KEYS.has(key)) return "/stages/stage_common";
  if (key === "endWin" || key === "endFailed") return "/stages/stage_end";
  if (key.startsWith("obj_")) return "/stages/stage_obj";
  if (key.startsWith("op_")) return "/stages/stage_opening";
  if (STAGE_UI_KEYS.has(key)) return "/stages/stage_ui";

  return "/stages/stage_ui";
};

//* I png degli stage partono da 0, lo stage di gioco da 1
export const stageFileIndex = (stage: number = DEFAULT_STAGE): number =>
  Math.max(0, stage - 1);

//* Le road sono meno degli stage: ogni road copre lo stesso numero di stage di fila
const ROAD_COUNT = 6;
const ROAD_REUSE = 2;

export const roadFileIndex = (stageIndex: number): number =>
  Math.floor(Math.max(0, stageIndex) / ROAD_REUSE) % ROAD_COUNT;

const stageBackground = (index: number) =>
  `/stages/stage_background/backgroundStage_${index}.png`;

const STAGE_FILE: Record<string, (index: number) => string> = {
  opening: (index) => `/stages/stage_opening/op_${index}.png`,
  backgroundStage: stageBackground,
  backgroundGame: stageBackground,
  endBackground: stageBackground,
  road: (index) => `/stages/stage_road/road_${roadFileIndex(index)}.png`,
};

export const AssetPaths = {
  image: (key: string, stage: number = DEFAULT_STAGE) => {
    const staged = STAGE_FILE[key];

    if (staged) return staged(stageFileIndex(stage));

    return `${folderFor(key)}/${FILE_NAME[key] ?? key}.png`;
  },
  audio: (key: string) => `/sounds/${key}.mp3`,
  font: (key: string) => `/fonts/${key}.ttf`,
};
