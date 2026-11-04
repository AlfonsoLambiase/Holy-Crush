import * as Phaser from "phaser";

import {layoutScaleForViewport} from "@/settings/app-header-layout";

/** Quota larghezza schermo (display piastra); cresce leggermente su viewport grandi. */
const WIDTH_RATIO_MIN = 0.64;
const WIDTH_RATIO_MAX = 0.82;
const HEIGHT_RATIO_MAX = 0.42;

export type PopupPlateScaleOptions = {
  widthRatioMin?: number;
  widthRatioMax?: number;
  heightRatioMax?: number;
};

/** Scala uniforme PNG popup + figli nel container (non full-bleed). */
export function popupPlateScale(
  scene: Phaser.Scene,
  textureKey: string,
  options?: PopupPlateScaleOptions,
): number {
  const {width, height} = scene.scale;

  if (!scene.textures.exists(textureKey)) return 0.5;

  const src = scene.textures.get(textureKey).getSourceImage() as {width: number; height: number};
  const panelW = Math.max(1, src.width);
  const panelH = Math.max(1, src.height);
  const widthRatio = layoutScaleForViewport(
    width,
    height,
    options?.widthRatioMin ?? WIDTH_RATIO_MIN,
    options?.widthRatioMax ?? WIDTH_RATIO_MAX,
  );
  const targetW = width * widthRatio;
  const targetH = height * (options?.heightRatioMax ?? HEIGHT_RATIO_MAX);

  return Math.min(targetW / panelW, targetH / panelH);
}

/** gameContainer è alto: serve più quota verticale del popup shop orizzontale. */
export function specialOfferPlateScale(scene: Phaser.Scene, textureKey: string): number {
  return popupPlateScale(scene, textureKey, {
    widthRatioMin: 0.7,
    widthRatioMax: 0.92,
    heightRatioMax: 0.86,
  });
}
