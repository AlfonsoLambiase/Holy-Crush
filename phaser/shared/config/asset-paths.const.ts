import {
  type StageSceneryTheme,
  sceneryBackgroundPath,
  sceneryBlockPath,
  sceneryRoadPath,
  stageSceneryTheme,
} from "@/settings/stage-scenery-assets";
import {STAGE_COUNT} from "@/settings/stage-map";

//* Mappa i nomi logici degli asset sulle cartelle reali dentro /public/images
export const DEFAULT_STAGE = 1;

const IMAGES = "/images";

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
  "confetti_left",
  "confetti_right",
  "logo_stage_bg",
  "logo_stage_fill",
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
  "G",
  "H",
  "I",
  "J",
  "L",
  "R",
  "V",
  "X",
]);

//* Il file su disco non coincide col nome logico usato in gioco
const FILE_NAME: Record<string, string> = {
  endWin: "endWin_0",
  endFailed: "endFailed_0",
  settingsHome: "settings",
};

const folderFor = (key: string): string => {
  if (key === "starsEffect" || key === "sparklingStars") return `${IMAGES}/effects`;
  if (HOME_UI_KEYS.has(key)) return `${IMAGES}/ui_home`;
  if (UI_GAME_KEYS.has(key)) return `${IMAGES}/ui_game`;
  if (STAGE_COMMON_KEYS.has(key)) return `${IMAGES}/mode_0/stage_common`;
  if (key.startsWith("endWin") || key === "endFailed") return `${IMAGES}/mode_0/stage_end`;
  if (key.startsWith("obj_")) return `${IMAGES}/mode_0/stage_obj`;
  if (key.startsWith("op_")) return `${IMAGES}/mode_0/stage_opening`;
  if (STAGE_UI_KEYS.has(key)) return `${IMAGES}/mode_0/stage_ui`;

  return `${IMAGES}/mode_0/stage_ui`;
};

//* I png degli stage partono da 0, lo stage di gioco da 1
export const stageFileIndex = (stage: number = DEFAULT_STAGE): number => {
  const index = Math.max(0, Math.floor(stage) - 1);

  if (STAGE_COUNT <= 0) return 0;

  return Math.min(index, STAGE_COUNT - 1);
};

const STAGE_FILE: Record<string, (fileIndex: number) => string> = {
  opening: (index) => `${IMAGES}/mode_0/stage_opening/op_${index}.png`,
  stageMascot: (index) => `${IMAGES}/mode_0/stage_thumbnail/thumbnail_${index}.png`,
};

const SCENERY_PATH: Record<string, (theme: StageSceneryTheme) => string> =
  {
    backgroundStage: sceneryBackgroundPath,
    backgroundGame: sceneryBackgroundPath,
    endBackground: sceneryBackgroundPath,
    block: sceneryBlockPath,
    road: sceneryRoadPath,
  };

export const AssetPaths = {
  image: (key: string, stage: number = DEFAULT_STAGE) => {
    const sceneryPath = SCENERY_PATH[key];

    if (sceneryPath) return sceneryPath(stageSceneryTheme(stage));

    const staged = STAGE_FILE[key];

    if (staged) return staged(stageFileIndex(stage));

    return `${folderFor(key)}/${FILE_NAME[key] ?? key}.png`;
  },
  audio: (key: string) => `/sounds/${key}.mp3`,
  font: (key: string) => `/fonts/${key}.ttf`,
};
