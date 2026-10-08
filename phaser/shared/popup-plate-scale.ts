import * as Phaser from "phaser";

import {layoutScaleForViewport} from "@/settings/app-header-layout";

/** Quota larghezza schermo (display piastra); cresce leggermente su viewport grandi. */
const WIDTH_RATIO_MIN = 0.64;
const WIDTH_RATIO_MAX = 0.82;
const HEIGHT_RATIO_MAX = 0.42;

/** Scala uniforme PNG popup + figli nel container (non full-bleed). */
export function popupPlateScale(scene: Phaser.Scene, textureKey: string): number {
  const {width, height} = scene.scale;

  if (!scene.textures.exists(textureKey)) return 0.5;

  const src = scene.textures.get(textureKey).getSourceImage() as {width: number; height: number};
  const panelW = Math.max(1, src.width);
  const panelH = Math.max(1, src.height);
  const widthRatio = layoutScaleForViewport(width, height, WIDTH_RATIO_MIN, WIDTH_RATIO_MAX);
  const targetW = width * widthRatio;
  const targetH = height * HEIGHT_RATIO_MAX;

  return Math.min(targetW / panelW, targetH / panelH);
}
