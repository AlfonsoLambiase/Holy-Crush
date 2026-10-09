import {getPieceKeysForStageLevel} from "@/settings/level-pieces";
import {getUnlockedCount} from "@/settings/progress";

import {CandyCrushAssetConf} from "../config/asset-conf.const";
import {AssetPaths, DEFAULT_STAGE} from "../config/asset-paths.const";

const assetConf = CandyCrushAssetConf;

export const tileSize: number = 64;

type ImageKey = keyof typeof assetConf.image;
type SpritesheetKey = keyof typeof assetConf.spritesheet;
type AudioKey = keyof typeof assetConf.audio;

const OPENING_IMAGES: ImageKey[] = ["opening", "line"];

const STAGE_MAP_IMAGES: ImageKey[] = [
  "backgroundStage",
  "road",
  "stageMascot",
  "btnPlay",
  "btnPlayBlock",
  "btnRead",
  "btnExitGame",
  "logo_stage_bg",
  "logo_stage_fill",
  "popupExitGame",
];

const GAME_CORE_IMAGES: ImageKey[] = [
  "backgroundGame",
  "block",
  "rocket",
  "bomb",
  "G",
  "H",
  "I",
  "J",
  "L",
  "R",
  "V",
  "X",
  "super",
  "mega",
  "super_disabled",
  "mega_disabled",
  "containerItems",
  "containerItems_bg",
  "containerScore",
  "settingsHome",
  "btnSound",
  "btnNoSound",
  "btnReload",
  "btnConfirm",
  "btnCancel",
  "popupExitGame",
  "btnExitGame",
  "endBackground",
  "endWin",
  "endWin_bg",
  "endWin_fill",
  "endFailed",
];

const GAME_SPRITESHEETS: SpritesheetKey[] = ["starsEffect", "confetti_left", "confetti_right"];

/** SFX usati in partita / outro (caricati lazy al primo play). */
export const GAME_AUDIO_KEYS: AudioKey[] = [
  "success",
  "error",
  "explosion",
  "missile",
  "fill",
  "endWin",
  "endFailed",
  "winSound",
  "loseSound",
];

export const queueImageLoads = (
  scene: Phaser.Scene,
  keys: readonly ImageKey[],
  stage: number = DEFAULT_STAGE,
): void => {
  for (const key of keys) {
    if (scene.textures.exists(key)) continue;

    scene.load.image(key, AssetPaths.image(key, stage));
  }
};

export const queueSpritesheetLoads = (
  scene: Phaser.Scene,
  keys: readonly SpritesheetKey[],
  stage: number = DEFAULT_STAGE,
): void => {
  for (const key of keys) {
    if (scene.textures.exists(key)) continue;

    const sheet = assetConf.spritesheet[key];

    scene.load.spritesheet(key, AssetPaths.image(key, stage), {
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
    });
  }
};

export const queueAudioLoads = (scene: Phaser.Scene, keys: readonly AudioKey[]): void => {
  for (const key of keys) {
    if (scene.cache.audio.exists(key)) continue;

    scene.load.audio(key, AssetPaths.audio(key));
  }
};

export const loadFonts = (scene: Phaser.Scene) => {
  for (const [file, family] of Object.entries(assetConf.font)) {
    scene.load.font(family, AssetPaths.font(file), "truetype");
  }
};

export const loadOpeningBootAssets = (scene: Phaser.Scene, stage: number = DEFAULT_STAGE): void => {
  queueImageLoads(scene, OPENING_IMAGES, stage);
};

export const loadStageMapBootAssets = (scene: Phaser.Scene, stage: number = DEFAULT_STAGE): void => {
  queueImageLoads(scene, STAGE_MAP_IMAGES, stage);
};

export const loadGameAssets = (
  scene: Phaser.Scene,
  stage: number = DEFAULT_STAGE,
  level?: number,
): void => {
  queueImageLoads(scene, GAME_CORE_IMAGES, stage);

  const stageIndex = Math.max(0, Math.floor(stage) - 1);
  const localLevel =
    level ??
    (Number(scene.registry.get("level")) ||
      getUnlockedCount() ||
      1);

  for (const key of getPieceKeysForStageLevel(localLevel, stageIndex)) {
    if (scene.textures.exists(key)) continue;

    scene.load.image(key, AssetPaths.image(key, stage));
  }

  queueSpritesheetLoads(scene, GAME_SPRITESHEETS, stage);
};

export type BootSceneTarget = "opening" | "stageMap";

export const resolveBootSceneTarget = (
  bootStart: "default" | "opening" | "stageMap",
  shouldPlayOpening: boolean,
): BootSceneTarget => {
  if (bootStart === "opening") return "opening";
  if (bootStart === "stageMap") return "stageMap";

  return shouldPlayOpening ? "opening" : "stageMap";
};

export const loadBootAssets = (
  scene: Phaser.Scene,
  stage: number,
  target: BootSceneTarget,
): void => {
  if (target === "opening") {
    loadOpeningBootAssets(scene, stage);
  } else {
    loadStageMapBootAssets(scene, stage);
  }

  loadFonts(scene);
};

/** @deprecated Usare i pack per fase; mantenuto per compatibilità outro. */
export const loadImages = (scene: Phaser.Scene, stage: number = DEFAULT_STAGE) => {
  queueImageLoads(scene, Object.keys(assetConf.image) as ImageKey[], stage);
};

/** @deprecated Usare lazy audio in AudioManager. */
export const loadAudios = (scene: Phaser.Scene) => {
  queueAudioLoads(scene, Object.keys(assetConf.audio) as AudioKey[]);
};

/** @deprecated Usare queueSpritesheetLoads. */
export const loadSpritesheets = (scene: Phaser.Scene, stage: number = DEFAULT_STAGE) => {
  queueSpritesheetLoads(scene, Object.keys(assetConf.spritesheet) as SpritesheetKey[], stage);
};
