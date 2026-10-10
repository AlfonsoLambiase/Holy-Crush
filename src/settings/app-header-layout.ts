import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../../phaser/shared/config/layout.const";

import {
  BTN_READ_NATIVE_HEIGHT,
  CORNER_BUTTON,
  CORNER_INSET_MUL,
  HEADER_INSET_BASE_MUL,
  LOGO_HEART,
  VIEWPORT_LERP,
} from "./app-header-tokens";

export type HeaderSurface = keyof typeof CORNER_INSET_MUL;

export const readRootFontSizePx = (): number => {
  if (typeof window === "undefined") return 16;

  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
};

/** Altezza CSS px bottoni angolo (home / header). */
export const cornerButtonCssPx = (
  cssViewportW: number,
  rootFontSizePx = readRootFontSizePx(),
): number =>
  Math.min(
    cssViewportW * (CORNER_BUTTON.vw / 100),
    CORNER_BUTTON.maxRem * rootFontSizePx,
  );

export const MAX_RENDER_DPR = 2;

/** Lato lungo CSS: da qui il cap scende (tablet / finestra larga). */
const WIDE_SCREEN_CSS = 1000;
const VERY_WIDE_SCREEN_CSS = 1280;

export const devicePixelRatio = (): number =>
  typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

/** `navigator.deviceMemory` è in GB, a bucket. Sotto i 2 GB il framebuffer va a 1. */
const LOW_DEVICE_MEMORY_GB = 2;

const deviceMemoryGb = (): number | null => {
  if (typeof navigator === "undefined") return null;

  const memory = (navigator as Navigator & {deviceMemory?: number}).deviceMemory;

  return typeof memory === "number" ? memory : null;
};

/**
 * Framebuffer del canvas di gioco.
 * Phone resta a 2. Schermo largo (lato lungo ≥1000) scende a 1.5, ≥1280 a 1.
 * Con deviceMemory ≤ 2 il cap è 1 anche sul phone. Su iOS l'API non c'è.
 */
export const cappedDevicePixelRatio = (): number => {
  const dpr = devicePixelRatio();

  if (typeof window === "undefined") return Math.min(dpr, MAX_RENDER_DPR);

  const longSide = Math.max(window.innerWidth, window.innerHeight);
  let cap =
    longSide >= VERY_WIDE_SCREEN_CSS ? 1 : longSide >= WIDE_SCREEN_CSS ? 1.5 : MAX_RENDER_DPR;
  const memory = deviceMemoryGb();

  if (memory !== null && memory <= LOW_DEVICE_MEMORY_GB) cap = 1;

  return Math.min(dpr, cap);
};

/** Scala viewport (pixel di gioco / DPR), uguale a Phaser `getViewportGlobalScale`. */
export const viewportGlobalScale = (physicalW: number, physicalH: number): number => {
  const dpr = cappedDevicePixelRatio();
  const cssWidth = physicalW / dpr;
  const cssHeight = physicalH / dpr;
  const calculated = Math.min(physicalW / 1080, physicalH / 1920);
  let globalScale = Math.min(
    Math.max(calculated, VIEWPORT_LERP.globalScaleMin),
    VIEWPORT_LERP.globalScaleMax,
  );
  const isBigScreen =
    cssWidth * dpr >= VIEWPORT_LERP.bigScreenPhysicalW ||
    cssHeight * dpr >= VIEWPORT_LERP.bigScreenPhysicalH;

  if (
    !isBigScreen &&
    cssWidth < VIEWPORT_LERP.smallScreenCssW &&
    cssHeight < VIEWPORT_LERP.smallScreenCssH
  ) {
    globalScale *= VIEWPORT_LERP.smallScreenScalePenalty;
  }

  return globalScale;
};

export const layoutScaleForViewport = (
  physicalW: number,
  physicalH: number,
  minValue: number,
  maxValue: number,
): number => {
  const globalScale = viewportGlobalScale(physicalW, physicalH);
  const {lerpAtGlobalMin, lerpAtGlobalMax} = VIEWPORT_LERP;

  if (globalScale >= lerpAtGlobalMax) return maxValue;
  if (globalScale <= lerpAtGlobalMin) return minValue;

  const t = (globalScale - lerpAtGlobalMin) / (lerpAtGlobalMax - lerpAtGlobalMin);

  return minValue + t * (maxValue - minValue);
};

export const readSafeTopCss = (): number => {
  if (typeof window === "undefined") return 0;

  const raw = getComputedStyle(document.documentElement).getPropertyValue("--safe-top");

  return parseFloat(raw) || 0;
};

export type ResolvedHeaderMetrics = {
  cornerButtonCss: number;
  cornerButtonPhysical: number;
  logoHeartPhysical: number;
  headerCenterY: number;
  marginTop: number;
  insetX: number;
  cornerButtonScale: number;
};

const logoHeartPhysical = (
  surface: HeaderSurface,
  physicalW: number,
  physicalH: number,
  btnReadNativeHeight: number,
): number => {
  const baseButtonScale = layoutScaleForViewport(
    physicalW,
    physicalH,
    LOGO_HEART.viewportBtnScaleMin,
    LOGO_HEART.viewportBtnScaleMax,
  );
  const surfaceMul =
    surface === "stageMap"
      ? LOGO_HEART.stageMapDisplayMul
      : surface === "world"
        ? LOGO_HEART.worldDisplayMul
        : 1;

  return (
    btnReadNativeHeight *
    baseButtonScale *
    LOGO_HEART.textureBaseMul *
    LOGO_HEART.displayMul *
    surfaceMul
  );
};

const headerMarginTopPhysical = (physicalW: number, physicalH: number): number =>
  LOGO_HEART.marginTopPx *
  layoutScaleForViewport(
    physicalW,
    physicalH,
    LOGO_HEART.marginTopLerpMin,
    LOGO_HEART.marginTopLerpMax,
  );

const cornerInsetPhysical = (
  surface: HeaderSurface,
  physicalW: number,
  physicalH: number,
): number =>
  layoutScaleForViewport(physicalW, physicalH, HEADER_INSET_MIN, HEADER_INSET_MAX) *
  HEADER_INSET_BASE_MUL *
  CORNER_INSET_MUL[surface];

/** Metriche header unificate (React mondi, Phaser stage, Phaser partita). */
export const resolveHeaderMetrics = (
  surface: HeaderSurface,
  physicalW: number,
  physicalH: number,
  safeTopPhysical: number,
  btnReadNativeHeight = BTN_READ_NATIVE_HEIGHT,
): ResolvedHeaderMetrics => {
  const dpr = cappedDevicePixelRatio();
  const cssW = physicalW / dpr;
  const cornerButtonCss = cornerButtonCssPx(cssW);
  const cornerButtonPhysical = cornerButtonCss * dpr;
  const logoHeart = logoHeartPhysical(
    surface,
    physicalW,
    physicalH,
    btnReadNativeHeight,
  );
  const marginTop = headerMarginTopPhysical(physicalW, physicalH);
  const headerCenterY = safeTopPhysical + marginTop + logoHeart / 2;

  return {
    cornerButtonCss,
    cornerButtonPhysical,
    logoHeartPhysical: logoHeart,
    headerCenterY,
    marginTop,
    insetX: cornerInsetPhysical(surface, physicalW, physicalH),
    cornerButtonScale: cornerButtonPhysical / btnReadNativeHeight,
  };
};

export const phaserImageScale = (
  nativeHeight: number,
  targetDisplayHeight: number,
): number => (nativeHeight > 0 ? targetDisplayHeight / nativeHeight : 1);

/** @deprecated alias */
export const homeMenuButtonSizePx = cornerButtonCssPx;
