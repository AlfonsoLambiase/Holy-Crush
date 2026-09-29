import * as Phaser from "phaser";

import {getHeartRemaining} from "@/settings/heart";
import {DRAIN_FILL_IN_CIRCLE} from "@/settings/stage-map";
import {CandyCrushAssetConf} from "./config/asset-conf.const";

const assetConf = CandyCrushAssetConf;

export type StageHeart = {
  setRemaining: (remaining: number) => void;
};

//* Un filo più grande dei bottoni laterali, che restano centrati sulla sua riga
export const STAGE_HEART_SCALE = 1.55;

export const addStageHeart = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  depth = 9,
): StageHeart | null => {
  const bgKey = assetConf.image.logo_stage_bg;
  const fillKey = assetConf.image.logo_stage_fill;

  if (!scene.textures.exists(bgKey) || !scene.textures.exists(fillKey) || size <= 0) return null;

  const bg = scene.add.image(x, y, bgKey).setDepth(depth).setScrollFactor(0);
  const fill = scene.add.image(x, y, fillKey).setDepth(depth + 1).setScrollFactor(0);
  const scale = size / bg.height;
  let maskGraphics: Phaser.GameObjects.Graphics | null = null;

  bg.setScale(scale);
  fill.setScale(scale);

  const setRemaining = (remaining: number) => {
    const amount = Phaser.Math.Clamp(remaining, 0, 1);

    fill.clearMask(true);
    maskGraphics?.destroy();
    maskGraphics = null;

    if (amount <= 0) {
      fill.setVisible(false);

      return;
    }

    fill.setVisible(true);

    if (amount >= 1) return;

    maskGraphics = scene.make.graphics({}, false);
    maskGraphics.fillStyle(0xffffff);

    if (DRAIN_FILL_IN_CIRCLE) {
      const radius = Math.max(fill.displayWidth, fill.displayHeight) / 2;
      const start = -Math.PI / 2 + (1 - amount) * Math.PI * 2;

      maskGraphics.slice(fill.x, fill.y, radius, start, -Math.PI / 2 + Math.PI * 2, false);
      maskGraphics.fillPath();
    } else {
      const left = fill.x - fill.displayWidth / 2;
      const top = fill.y - fill.displayHeight / 2;

      maskGraphics.fillRect(left, top, fill.displayWidth * amount, fill.displayHeight);
    }

    fill.setMask(maskGraphics.createGeometryMask());
  };

  setRemaining(getHeartRemaining());

  return {setRemaining};
};
