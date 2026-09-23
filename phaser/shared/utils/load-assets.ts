import {CandyCrushAssetConf} from "../config/asset-conf.const";
import {AssetPaths, DEFAULT_STAGE} from "../config/asset-paths.const";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

export const tileSize: number = 64;

export const loadAudios = (scene: Phaser.Scene) => {
  for (const key in assetConf.audio) {
    scene.load.audio(key, AssetPaths.audio(key));
  }
};

export const loadSpritesheets = (scene: Phaser.Scene, stage: number = DEFAULT_STAGE) => {
  for (const [key, value] of Object.entries(assetConf.spritesheet)) {
    scene.load.spritesheet(key, AssetPaths.image(key, stage), {
      frameWidth: value.frameWidth,
      frameHeight: value.frameHeight,
    });
  }
};

export const loadImages = (scene: Phaser.Scene, stage: number = DEFAULT_STAGE) => {
  for (const key in assetConf.image) {
    scene.load.image(key, AssetPaths.image(key, stage));
  }
};

export const loadFonts = (scene: Phaser.Scene) => {
  for (const [file, family] of Object.entries(assetConf.font)) {
    scene.load.font(family, AssetPaths.font(file), "truetype");
  }
};
