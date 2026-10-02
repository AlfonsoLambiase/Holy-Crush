import * as Phaser from "phaser";

import {getHeartRemaining} from "@/settings/heart";
import {DRAIN_FILL_IN_CIRCLE} from "@/settings/stage-map";
import {STAGE_HEART_SCALE} from "@/settings/stage-ui-paths";

export {STAGE_HEART_SCALE};
import {CandyCrushAssetConf} from "./config/asset-conf.const";
import {addFillPair, type FillPair} from "./fill-pair";

const assetConf = CandyCrushAssetConf;

export type StageHeart = FillPair;

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

  const src = scene.textures.get(bgKey).getSourceImage() as {height: number};
  return addFillPair(
    scene,
    x,
    y,
    bgKey,
    fillKey,
    size / src.height,
    depth,
    getHeartRemaining(),
    DRAIN_FILL_IN_CIRCLE ? "wedge" : "rect",
  );
};
