import * as Phaser from "phaser";

import {layoutScaleForViewport, viewportGlobalScale} from "@/settings/app-header-layout";

/** Scala viewport allineata a Game / stage map (1080×1920, clamp, penalità schermi piccoli). */
export function getViewportGlobalScale(scene: Phaser.Scene): number {
  const {width, height} = scene.scale;

  return viewportGlobalScale(width, height);
}

export function dynamicValueForViewport(
  scene: Phaser.Scene,
  minValue: number,
  maxValue: number,
): number {
  const {width, height} = scene.scale;

  return layoutScaleForViewport(width, height, minValue, maxValue);
}
