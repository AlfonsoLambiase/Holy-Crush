import {normalizeStageIndex} from "./stage-map";

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
  `/images/mode_0/stage_background/bg_${theme}.png`;

export const sceneryBlockPath = (theme: StageSceneryTheme): string =>
  `/images/mode_0/stage_block/block_${theme}.png`;

export const sceneryRoadPath = (theme: StageSceneryTheme): string =>
  `/images/mode_0/stage_road/road_${theme}.png`;

/** Placca sotto i block (tono affine al block_* ma più soft per far leggere i pezzi). */
const PLATE_FILL_BY_THEME: Record<StageSceneryTheme, string> = {
  pietra_notte: "#94a8d9",
  terra_notte: "#a08882",
  sabbia_notte: "#a89488",
  terra: "#c4a882",
  legno: "#b8a574",
  sabbia: "#d0bf9e",
  pietra: "#a8b4c6",
  mare_notte: "#72b8d4",
  pietra_guerra: "#b09898",
  cielo: "#9ec8ea",
};

export const plateFillForTheme = (theme: StageSceneryTheme): string =>
  PLATE_FILL_BY_THEME[theme];

export const plateFillForStage = (stageOneBased: number): string =>
  plateFillForTheme(stageSceneryTheme(stageOneBased));

/** Tema usato da almeno uno stage (per preload batch futuro). */
export const uniqueSceneryThemes = (): StageSceneryTheme[] => {
  const used = new Set<StageSceneryTheme>(SCENERY_THEME_BY_STAGE);

  return STAGE_SCENERY_THEMES.filter((theme) => used.has(theme));
};
