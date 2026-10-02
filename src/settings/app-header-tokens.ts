/**
 * Regola qui taglie logo e bottoni angolo (read / exit / shop-like) in tutta l’app.
 * Layout (inset per schermata) in `CORNER_INSET_MUL`; scala viewport in `VIEWPORT_LERP`.
 */

/** Altezza nativa asset `btnRead.png` (px sorgente). */
export const BTN_READ_NATIVE_HEIGHT = 156;

/** Corner button: stessa regola della home (`min(16vw, 4.75rem)`). */
export const CORNER_BUTTON = {
  vw: 16,
  maxRem: 4.75,
} as const;

/** Logo cuore centrale: altezza = btnRead × lerp(viewport) × textureBaseMul × displayMul. */
export const LOGO_HEART = {
  /** Lerp scala viewport sul logo (min/max moltiplicatore btn read). */
  viewportBtnScaleMin: 0.18,
  viewportBtnScaleMax: 0.56,
  textureBaseMul: 1.12,
  displayMul: 2.48,
  /** Pagina mondi (`WorldScreen` / React HUD). */
  worldDisplayMul: 1.2,
  /** Mappa stage (Phaser): stesso design mondi, scala schermo diversa → riduci qui. */
  stageMapDisplayMul: 0.36,
  marginTopPx: 40,
  marginTopLerpMin: 0.4,
  marginTopLerpMax: 1,
} as const;

/**
 * Inset orizzontale = lerp(HEADER_INSET) × headerInsetBaseMul × valore sotto.
 * Più alto = bottoni più lontani dal bordo.
 */
export const CORNER_INSET_MUL = {
  world: 0.52,
  stageMap: 0.68,
  inGame: 0.52,
} as const;

/** Base inset header (profilo “world”) prima del moltiplicatore superficie. */
export const HEADER_INSET_BASE_MUL = 1.38;

/** Lerp globale viewport (1080×1920, clamp, penalità schermi piccoli). */
export const VIEWPORT_LERP = {
  globalScaleMin: 0.59,
  globalScaleMax: 1.2,
  lerpAtGlobalMin: 0.5,
  lerpAtGlobalMax: 1,
  smallScreenScalePenalty: 0.7,
  smallScreenCssW: 750,
  smallScreenCssH: 450,
  bigScreenPhysicalW: 2500,
  bigScreenPhysicalH: 1400,
} as const;

/** @deprecated Usa `LOGO_HEART.*` — re-export per compat. */
export const STAGE_HEADER_BTN_MIN = LOGO_HEART.viewportBtnScaleMin;
export const STAGE_HEADER_BTN_MAX = LOGO_HEART.viewportBtnScaleMax;
export const STAGE_HEART_SCALE = LOGO_HEART.textureBaseMul;
export const WORLD_HEART_SCALE = LOGO_HEART.displayMul;
export const WORLD_HEADER_SIZE_MUL = HEADER_INSET_BASE_MUL;
export const WORLD_EXIT_BTN_INSET_MUL = CORNER_INSET_MUL.world;
export const STAGE_MAP_CORNER_BTN_INSET_MUL = CORNER_INSET_MUL.stageMap;
export const STAGE_MAP_HEADER_SIZE_MUL = 0.72;

/** @deprecated Logo partita = stesso `LOGO_HEART` (usa `resolveHeaderMetrics('inGame')`). */
export const GAME_HEART_SCALE = LOGO_HEART.displayMul / LOGO_HEART.textureBaseMul;
