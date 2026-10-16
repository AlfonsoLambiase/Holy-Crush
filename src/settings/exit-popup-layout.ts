import {
  cappedDevicePixelRatio,
  layoutScaleForViewport,
} from "@/settings/app-header-layout";

/** PNG `popupExitGame.png` (px nativi). */
export const EXIT_POPUP_NATIVE = {width: 863, height: 1152} as const;

export const EXIT_POPUP_TITLE_Y_RATIO = -0.22;
export const EXIT_POPUP_CHOICE_Y_RATIO = 0.16;
export const EXIT_POPUP_TITLE_WRAP_RATIO = 0.78;

const WIDTH_RATIO_MIN = 0.64;
const WIDTH_RATIO_MAX = 0.82;
const HEIGHT_RATIO_MAX = 0.42;

/** Stessa formula di `popupPlateScale` (Phaser), risultato in px CSS. */
export const computeExitPopupPlateCssWidth = (
  viewportCssWidth: number,
  viewportCssHeight: number,
): number => {
  const dpr = cappedDevicePixelRatio();
  const physicalW = viewportCssWidth * dpr;
  const physicalH = viewportCssHeight * dpr;
  const widthRatio = layoutScaleForViewport(
    physicalW,
    physicalH,
    WIDTH_RATIO_MIN,
    WIDTH_RATIO_MAX,
  );
  const targetW = physicalW * widthRatio;
  const targetH = physicalH * HEIGHT_RATIO_MAX;
  const scale = Math.min(
    targetW / EXIT_POPUP_NATIVE.width,
    targetH / EXIT_POPUP_NATIVE.height,
  );

  return (EXIT_POPUP_NATIVE.width * scale) / dpr;
};
