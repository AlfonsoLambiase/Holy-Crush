import * as Phaser from "phaser";

import {getHeartRemaining} from "@/settings/heart";
import {DRAIN_FILL_IN_CIRCLE} from "@/settings/stage-map";
import {CandyCrushAssetConf} from "./config/asset-conf.const";
import {addFillPair, type FillPair} from "./fill-pair";

const assetConf = CandyCrushAssetConf;

export type StageHeart = FillPair;

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

  if (!scene.textures.exists(bgKey) || size <= 0) return null;

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
