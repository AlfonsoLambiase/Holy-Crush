import * as Phaser from "phaser";

import {getClearedCount} from "@/settings/progress";
import {DRAIN_FILL_IN_CIRCLE} from "@/settings/stage-map";
import {CandyCrushAssetConf} from "./config/asset-conf.const";

const assetConf = CandyCrushAssetConf;
const FILL_STEP = 0.2;

//* Un filo più grande dei bottoni laterali, che restano centrati sulla sua riga
export const STAGE_HEART_SCALE = 1.55;

export const addStageHeart = (scene: Phaser.Scene, x: number, y: number, size: number, depth = 9) => {
  const bgKey = assetConf.image.logo_stage_bg;
  const fillKey = assetConf.image.logo_stage_fill;

  if (!scene.textures.exists(bgKey) || !scene.textures.exists(fillKey) || size <= 0) return null;

  const bg = scene.add.image(x, y, bgKey).setDepth(depth).setScrollFactor(0);
  const fill = scene.add.image(x, y, fillKey).setDepth(depth + 1).setScrollFactor(0);
  const scale = size / bg.height;

  bg.setScale(scale);
  fill.setScale(scale);
  maskFill(scene, fill, Math.max(0, 1 - getClearedCount() * FILL_STEP));

  return bg;
};

const maskFill = (scene: Phaser.Scene, fill: Phaser.GameObjects.Image, remaining: number) => {
  if (remaining >= 1) return;

  if (remaining <= 0) {
    fill.setVisible(false);

    return;
  }

  const mask = scene.make.graphics({}, false);

  mask.fillStyle(0xffffff);

  if (DRAIN_FILL_IN_CIRCLE) {
    const radius = Math.max(fill.displayWidth, fill.displayHeight) / 2;
    const start = -Math.PI / 2 + (1 - remaining) * Math.PI * 2;

    mask.slice(fill.x, fill.y, radius, start, -Math.PI / 2 + Math.PI * 2, false);
    mask.fillPath();
  } else {
    const left = fill.x - fill.displayWidth / 2;
    const top = fill.y - fill.displayHeight / 2;

    mask.fillRect(left, top, fill.displayWidth * remaining, fill.displayHeight);
  }

  fill.setMask(mask.createGeometryMask());
};
