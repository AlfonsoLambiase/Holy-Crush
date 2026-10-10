import {BTN_READ_NATIVE_HEIGHT, LOGO_HEART} from "./app-header-tokens";
import {
  cappedDevicePixelRatio,
  layoutScaleForViewport,
  phaserImageScale,
  readSafeTopCss,
  resolveHeaderMetrics,
  viewportGlobalScale,
  type HeaderSurface,
  type ResolvedHeaderMetrics,
} from "./app-header-layout";

export {
  layoutScaleForViewport,
  phaserImageScale,
  readSafeTopCss,
  resolveHeaderMetrics,
  viewportGlobalScale,
  type HeaderSurface,
  type ResolvedHeaderMetrics,
};

export type StageHeaderProfile = "world" | "stageMap";

/** Altezza sorgente `btnRead.png` (allineato a Phaser). */
export const STAGE_BTN_READ_HEIGHT = BTN_READ_NATIVE_HEIGHT;

export type StageHeaderLayout = {
  headerCenterY: number;
  buttonScale: number;
  buttonDisplayHeight: number;
  heartSize: number;
  insetX: number;
  marginTop: number;
};

/** Legacy Phaser — preferire `resolveHeaderMetrics`. */
export const computeStageHeaderLayout = (
  physicalW: number,
  physicalH: number,
  safeTopPhysical: number,
  btnReadHeight = STAGE_BTN_READ_HEIGHT,
  profile: StageHeaderProfile = "stageMap",
): StageHeaderLayout => {
  const surface: HeaderSurface = profile === "world" ? "world" : "stageMap";
  const metrics = resolveHeaderMetrics(
    surface,
    physicalW,
    physicalH,
    safeTopPhysical,
    btnReadHeight,
  );
  const baseHeart =
    btnReadHeight *
    layoutScaleForViewport(
      physicalW,
      physicalH,
      LOGO_HEART.viewportBtnScaleMin,
      LOGO_HEART.viewportBtnScaleMax,
    ) *
    LOGO_HEART.textureBaseMul;

  return {
    headerCenterY: safeTopPhysical + metrics.marginTop + baseHeart / 2,
    buttonScale: metrics.cornerButtonScale,
    buttonDisplayHeight: metrics.cornerButtonPhysical,
    heartSize: baseHeart,
    insetX: metrics.insetX,
    marginTop: metrics.marginTop,
  };
};

export type StageHudMetrics = {
  headerCenterY: number;
  heartSize: number;
  buttonSize: number;
  insetX: number;
};

export type StageCornerButtonLayout = {
  insetX: number;
  buttonScale: number;
};

export type WorldScreenHeartLayout = {
  heartSize: number;
  headerCenterY: number;
  marginTop: number;
};

export const computeWorldScreenHeartLayout = (
  physicalW: number,
  physicalH: number,
  safeTopPhysical: number,
  btnReadHeight = STAGE_BTN_READ_HEIGHT,
): WorldScreenHeartLayout => {
  const metrics = resolveHeaderMetrics(
    "world",
    physicalW,
    physicalH,
    safeTopPhysical,
    btnReadHeight,
  );

  return {
    heartSize: metrics.logoHeartPhysical,
    headerCenterY: metrics.headerCenterY,
    marginTop: metrics.marginTop,
  };
};

export const computeStageMapHeartLayout = (
  physicalW: number,
  physicalH: number,
  safeTopPhysical: number,
  btnReadHeight = STAGE_BTN_READ_HEIGHT,
): WorldScreenHeartLayout => {
  const metrics = resolveHeaderMetrics(
    "stageMap",
    physicalW,
    physicalH,
    safeTopPhysical,
    btnReadHeight,
  );

  return {
    heartSize: metrics.logoHeartPhysical,
    headerCenterY: metrics.headerCenterY,
    marginTop: metrics.marginTop,
  };
};

export const computeStageCornerButtons = (
  physicalW: number,
  physicalH: number,
  safeTopPhysical: number,
  btnReadHeight: number,
  surface: HeaderSurface = "world",
): StageCornerButtonLayout => {
  const metrics = resolveHeaderMetrics(
    surface,
    physicalW,
    physicalH,
    safeTopPhysical,
    btnReadHeight,
  );

  return {
    insetX: metrics.insetX,
    buttonScale: metrics.cornerButtonScale,
  };
};

export const computeStageMapCornerButtons = (
  physicalW: number,
  physicalH: number,
  safeTopPhysical: number,
  btnReadHeight: number,
): StageCornerButtonLayout =>
  computeStageCornerButtons(
    physicalW,
    physicalH,
    safeTopPhysical,
    btnReadHeight,
    "stageMap",
  );

export const computeStageHudMetrics = (
  viewportCssWidth: number,
  viewportCssHeight: number,
): StageHudMetrics => {
  const dpr = cappedDevicePixelRatio();
  const physicalW = viewportCssWidth * dpr;
  const physicalH = viewportCssHeight * dpr;
  const safeTop = readSafeTopCss() * dpr;
  const metrics = resolveHeaderMetrics(
    "world",
    physicalW,
    physicalH,
    safeTop,
    STAGE_BTN_READ_HEIGHT,
  );

  return {
    headerCenterY: metrics.headerCenterY / dpr,
    heartSize: metrics.logoHeartPhysical / dpr,
    buttonSize: metrics.cornerButtonCss,
    insetX: metrics.insetX / dpr,
  };
};
