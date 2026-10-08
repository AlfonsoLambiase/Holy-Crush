import {normalizeStageIndex, STAGE_COUNT} from "./stage-map";

/** Set condiviso: bg_* / block_* / road_* (stesso slug). */
export const STAGE_SCENERY_THEMES = [
  "pietra_notte",
  "terra_notte",
  "sabbia_notte",
  "terra",
  "legno",
  "sabbia",
  "pietra",
  "mare_notte",
  "pietra_guerra",
  "cielo",
] as const;

export type StageSceneryTheme = (typeof STAGE_SCENERY_THEMES)[number];

/** Stage logico 0-based → tema scenery. */
const SCENERY_THEME_BY_STAGE: StageSceneryTheme[] = [
  "pietra_notte", // 0
  "terra_notte", // 1
  "pietra_notte", // 2
  "sabbia_notte", // 3
  "terra", // 4
  "legno", // 5
  "terra", // 6
  "sabbia", // 7
  "terra", // 8
  "terra", // 9
  "terra", // 10
  "pietra", // 11
  "mare_notte", // 12
  "pietra", // 13
  "pietra", // 14
  "pietra", // 15
  "pietra", // 16
  "pietra_guerra", // 17
  "terra", // 18
  "cielo", // 19
];

export const stageSceneryTheme = (stageOneBased: number): StageSceneryTheme => {
  const stageIndex = normalizeStageIndex(
    Math.max(0, Math.floor(stageOneBased) - 1),
  );

  return SCENERY_THEME_BY_STAGE[stageIndex] ?? SCENERY_THEME_BY_STAGE[0];
};

export const sceneryBackgroundPath = (theme: StageSceneryTheme): string =>
  `/mode_0/stage_background/bg_${theme}.png`;

export const sceneryBlockPath = (theme: StageSceneryTheme): string =>
  `/mode_0/stage_block/block_${theme}.png`;

export const sceneryRoadPath = (theme: StageSceneryTheme): string =>
  `/mode_0/stage_road/road_${theme}.png`;

/** Tema usato da almeno uno stage (per preload batch futuro). */
export const uniqueSceneryThemes = (): StageSceneryTheme[] => {
  const used = new Set<StageSceneryTheme>();

  for (let i = 0; i < STAGE_COUNT; i++) {
    used.add(SCENERY_THEME_BY_STAGE[i] ?? SCENERY_THEME_BY_STAGE[0]);
  }

  return STAGE_SCENERY_THEMES.filter((theme) => used.has(theme));
};
