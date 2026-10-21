import {
  type StageSceneryTheme,
  sceneryBackgroundPath,
  sceneryBlockPath,
  sceneryRoadPath,
  stageSceneryTheme,
} from "@/settings/stage-scenery-assets";
import {type FixedSceneryKey, getModeConfig} from "@/settings/game-mode";
import {getStageCount} from "@/settings/stage-map";

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
  "logo_stage_bg",
  "logo_stage_fill",
  "containerItems",
  "containerItems_bg",
]);

const STAGE_UI_KEYS = new Set([
  "confetti_left",
  "confetti_right",
]);

const MODE_STAGE_UI_KEYS = new Set(["containerScore"]);

const HOME_UI_KEYS = new Set(["settingsHome"]);

const GAME_COMMON = `${IMAGES}/game_common`;

const POWER_UP_KEYS = new Set([
  "bomb",
  "rocket",
  "super",
  "mega",
  "maxi",
  "ultra",
  "super_disabled",
  "mega_disabled",
  "maxi_disabled",
  "ultra_disabled",
]);

const OBJECTIVE_KEYS = new Set([
  "B",
  "C",
  "D",
  "G",
  "H",
  "H_1",
  "I",
  "J",
  "L",
  "R",
  "V",
  "X",
  "Z_0",
  "Z_1",
  "Z_2",
  "Z_3",
  "Z_4",
]);

//* Il file su disco non coincide col nome logico usato in gioco
const FILE_NAME: Record<string, string> = {
  endWin: "endWin_0",
  endFailed: "endFailed_0",
  settingsHome: "settings",
};

//* Cartella della modalità attiva (mode_0 / mode_1)
const modeFolder = (): string => `${IMAGES}/${getModeConfig().folder}`;

const folderFor = (key: string): string => {
  if (key === "sparklingStars") return `${IMAGES}/effects`;
  if (HOME_UI_KEYS.has(key)) return `${IMAGES}/ui_home`;
  if (MODE_STAGE_UI_KEYS.has(key)) return `${modeFolder()}/stage_ui`;
  if (UI_GAME_KEYS.has(key)) return `${IMAGES}/ui_game`;
  if (POWER_UP_KEYS.has(key)) return `${GAME_COMMON}/power-up`;
  if (OBJECTIVE_KEYS.has(key) || key.startsWith("obstacle_")) return `${GAME_COMMON}/objectives`;
  if (key === "line") return `${GAME_COMMON}/ui`;
  //* Arcobaleno e nuvola (bg/fill) restano quelli di mode_0 in ogni modalità
  if (key === "endWin" || key === "endFailed") return `${modeFolder()}/stage_end`;
  if (key.startsWith("endWin") || key.startsWith("endLose")) return `${IMAGES}/mode_0/stage_end`;
  if (key.startsWith("obj_")) return `${modeFolder()}/stage_obj`;
  if (key.startsWith("op_")) return `${modeFolder()}/stage_opening`;
  if (STAGE_UI_KEYS.has(key)) return `${IMAGES}/mode_0/stage_ui`;

  return `${IMAGES}/mode_0/stage_ui`;
};

//* I png degli stage partono da 0, lo stage di gioco da 1
export const stageFileIndex = (stage: number = DEFAULT_STAGE): number => {
  const index = Math.max(0, Math.floor(stage) - 1);
  const count = getStageCount();

  if (count <= 0) return 0;

  return Math.min(index, count - 1);
};

const STAGE_FILE: Record<string, (fileIndex: number) => string> = {
  opening: (index) => `${modeFolder()}/stage_opening/op_${index}.png`,
  stageMascot: (index) => `${modeFolder()}/stage_thumbnail/thumbnail_${index}.png`,
};

const SCENERY_PATH: Record<FixedSceneryKey, (theme: StageSceneryTheme) => string> =
  {
    backgroundStage: sceneryBackgroundPath,
    backgroundGame: sceneryBackgroundPath,
    endBackground: sceneryBackgroundPath,
    block: sceneryBlockPath,
    road: sceneryRoadPath,
  };

export const AssetPaths = {
  image: (key: string, stage: number = DEFAULT_STAGE) => {
    const sceneryPath = SCENERY_PATH[key as FixedSceneryKey];

    if (sceneryPath) {
      return getModeConfig().scenery?.[key as FixedSceneryKey] ?? sceneryPath(stageSceneryTheme(stage));
    }

    const staged = STAGE_FILE[key];

    if (staged) return staged(stageFileIndex(stage));

    return `${folderFor(key)}/${FILE_NAME[key] ?? key}.png`;
  },
  audio: (key: string) => `/sounds/${key}.mp3`,
  font: (key: string) => `/fonts/${key}.ttf`,
};
