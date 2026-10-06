import {STAGE_COUNT} from "@/settings/stage-map";

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
  "btnSound",
  "btnNoSound",
  "btnTime",
  "popupExitGame",
  "containerScore",
  "containerItems",
  "containerItems_bg",
]);

const STAGE_UI_KEYS = new Set([
  "backgroundGame",
  "backgroundScore",
  "backgroundGriglia",
  "confetti_left",
  "confetti_right",
  "endBackground",
  "logo_stage",
  "logo_stage_bg",
  "logo_stage_fill",
  "iconSandClock",
  "iconHelp",
  "iconScore",
  "iconLive",
  "logoPhaser",
  "animLive",
  "animBrokenHeart",
]);

const HOME_UI_KEYS = new Set(["settingsHome"]);

const STAGE_COMMON_KEYS = new Set([
  "bomb",
  "rocket",
  "obstacle_0",
  "obstacle_1",
  "line",
  "super",
  "mega",
  "super_disabled",
  "mega_disabled",
]);

//* Il file su disco non coincide col nome logico usato in gioco
const FILE_NAME: Record<string, string> = {
  endWin: "endWin_0",
  endFailed: "endFailed_0",
  settingsHome: "settings",
};

const folderFor = (key: string): string => {
  if (key === "starsEffect" || key === "sparklingStars") return "/effects";
  if (HOME_UI_KEYS.has(key)) return "/ui_home";
  if (UI_GAME_KEYS.has(key)) return "/ui_game";
  if (STAGE_COMMON_KEYS.has(key)) return "/mode_0/stage_common";
  if (key.startsWith("endWin") || key === "endFailed") return "/mode_0/stage_end";
  if (key.startsWith("obj_")) return "/mode_0/stage_obj";
  if (key.startsWith("op_")) return "/mode_0/stage_opening";
  if (STAGE_UI_KEYS.has(key)) return "/mode_0/stage_ui";

  return "/mode_0/stage_ui";
};

//* I png degli stage partono da 0, lo stage di gioco da 1
export const stageFileIndex = (stage: number = DEFAULT_STAGE): number => {
  const index = Math.max(0, Math.floor(stage) - 1);

  if (STAGE_COUNT <= 0) return 0;

  return Math.min(index, STAGE_COUNT - 1);
};

//* backgroundStage_N e road_N sono la stessa coppia di stage
const stageBackground = (index: number) =>
  `/mode_0/stage_background/backgroundStage_${index}.png`;

const STAGE_FILE: Record<string, (index: number) => string> = {
  opening: (index) => `/mode_0/stage_opening/op_${index}.png`,
  backgroundStage: stageBackground,
  backgroundGame: stageBackground,
  endBackground: stageBackground,
  block: (index) => `/mode_0/stage_block/block_${index}.png`,
  road: (index) => `/mode_0/stage_road/road_${index}.png`,
  stageMascot: (index) => `/mode_0/stage_thumbnail/thumbnail_${index}.png`,
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
