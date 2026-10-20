//* Nuovo Testamento (mode_0) e Antico Testamento (mode_1). Tutto ciò che cambia tra le due sta qui.

export type GameModeId = 0 | 1;

export type WorldTrack = "world0" | "world1" | "world2" | "world3" | "world4";

export type ModeWorld = {
  image: string;
  background: string;
  stages: number;
  track: WorldTrack;
};

export type FixedSceneryKey = "backgroundStage" | "backgroundGame" | "endBackground" | "block" | "road";

export type GameModeConfig = {
  folder: string;
  progressKey: string;
  stageLevels: number;
  /** Solo sull’ultimo stage del mondo (es. finale Antico Testamento). */
  finalStageLevels?: number;
  worlds: readonly ModeWorld[];
  objGroups: number;
  showVerses: boolean;
  openingTextKey?: string;
  scenery?: Record<FixedSceneryKey, string>;
};

const STORAGE_KEY = "holy-crush-mode";
const WORLD = "/images/world";
const MODE_0 = "/images/mode_0";

const world = (image: number, background: number, stages: number, track: WorldTrack): ModeWorld => ({
  image: `${WORLD}/world_${image}.png`,
  background: `${WORLD}/world_bg_${background}.png`,
  stages,
  track,
});

const GAME_MODES: Record<GameModeId, GameModeConfig> = {
  0: {
    folder: "mode_0",
    progressKey: "holy-crush-cleared",
    stageLevels: 20,
    worlds: [
      world(0, 0, 4, "world0"),
      world(1, 1, 3, "world1"),
      world(2, 2, 6, "world2"),
      world(3, 3, 5, "world3"),
      world(4, 4, 2, "world4"),
    ],
    objGroups: 8,
    showVerses: true,
  },
  1: {
    folder: "mode_1",
    progressKey: "holy-crush-cleared-old",
    stageLevels: 50,
    finalStageLevels: 300,
    worlds: [world(5, 4, 13, "world2")],
    objGroups: 3,
    showVerses: false,
    openingTextKey: "openingOldTestament",
    scenery: {
      backgroundStage: "/images/mode_1/stage_background/backgroundStage_0.png",
      backgroundGame: `${MODE_0}/stage_background/bg_cielo.png`,
      endBackground: `${MODE_0}/stage_background/bg_cielo.png`,
      block: `${MODE_0}/stage_block/block_cielo.png`,
      road: `${MODE_0}/stage_road/road_cielo.png`,
    },
  },
};

export const getGameMode = (): GameModeId => {
  if (typeof window === "undefined") return 0;

  return localStorage.getItem(STORAGE_KEY) === "1" ? 1 : 0;
};

export const setGameMode = (mode: GameModeId): void => {
  localStorage.setItem(STORAGE_KEY, String(mode));
};

export const getModeConfig = (): GameModeConfig => GAME_MODES[getGameMode()];

export const getModeConfigForMode = (mode: GameModeId): GameModeConfig => GAME_MODES[mode];

export const getStageCountForMode = (mode: GameModeId): number =>
  getModeConfigForMode(mode).worlds.reduce((sum, item) => sum + item.stages, 0);

export const getStageCount = (): number =>
  getModeConfig().worlds.reduce((sum, item) => sum + item.stages, 0);
