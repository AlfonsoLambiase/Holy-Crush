import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../../phaser/shared/config/layout.const";

import {STAGE_HEART_UI_SCALE} from "./stage-ui-paths";

const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;
const BTN_READ_SOURCE_HEIGHT = 156;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Stessa curva di `StageMapScene.#gameButtonScale`. */
export const gameButtonScale = (minValue: number, maxValue: number): number => {
  const cssWidth = typeof window !== "undefined" ? window.innerWidth : GAME_WIDTH;
  const cssHeight = typeof window !== "undefined" ? window.innerHeight : GAME_HEIGHT;
  const pixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const configWidth = cssWidth * pixelRatio;
  const configHeight = cssHeight * pixelRatio;
  const calculated = Math.min(configWidth / 1080, configHeight / 1920);
  let globalScale = Math.min(Math.max(calculated, 0.59), 1.2);
  const isBigScreen = cssWidth * pixelRatio >= 2500 || cssHeight * pixelRatio >= 1400;

  if (!isBigScreen && cssWidth < 750 && cssHeight < 450) globalScale *= 0.7;

  if (globalScale >= 1) return maxValue;
  if (globalScale <= 0.5) return minValue;

  const t = (globalScale - 0.5) / 0.5;

  return minValue + t * (maxValue - minValue);
};

export const readSafeTopCss = (): number => {
  if (typeof window === "undefined") return 0;

  const raw = getComputedStyle(document.documentElement).getPropertyValue("--safe-top");

  return parseFloat(raw) || 0;
};

export type StageHudMetrics = {
  headerCenterY: number;
  heartSize: number;
  buttonSize: number;
  insetX: number;
};

/** Zoom ENVELOP con tetto: su desktop non ingrandisce oltre ~phone-tablet. */
const cappedFitZoom = (viewportWidth: number, viewportHeight: number): number => {
  const zoom = Math.max(viewportWidth / GAME_WIDTH, viewportHeight / GAME_HEIGHT);

  return Math.min(zoom, 1.1);
};

/**
 * HUD React (WorldScreen): clamp + `gameButtonScale`, come i bottoni home (`clamp` + vw).
 * Full viewport — niente letterbox Phaser.
 */
export const computeStageHudMetrics = (
  viewportWidth: number,
  viewportHeight: number,
): StageHudMetrics => {
  const scale = gameButtonScale(0.35, 1);
  const insetScaled = gameButtonScale(HEADER_INSET_MIN, HEADER_INSET_MAX);
  const fitZoom = cappedFitZoom(viewportWidth, viewportHeight);

  const buttonRaw = BTN_READ_SOURCE_HEIGHT * scale * fitZoom;
  const buttonSize = clamp(buttonRaw, 42, 58);
  const heartSize = clamp(buttonRaw * STAGE_HEART_UI_SCALE, 64, 90);
  const insetX = clamp(insetScaled * fitZoom, 28, 88);

  const margin = clamp(40 * gameButtonScale(0.4, 1), 12, 34);
  const safeTop = readSafeTopCss();

  return {
    headerCenterY: safeTop + margin + heartSize / 2,
    heartSize,
    buttonSize,
    insetX,
  };
};

/** Inset destro bottone esci su World: scala con vw ma resta vicino al bordo. */
export const computeWorldExitInset = (viewportWidth: number): number =>
  clamp(viewportWidth * 0.018 + 8, 14, 28);

