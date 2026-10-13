import {getModeConfig, type ModeWorld} from "./game-mode";

export type WorldStageRange = {
  first: number;
  last: number;
  count: number;
};

const worlds = (): readonly ModeWorld[] => getModeConfig().worlds;

export const getWorldCount = (): number => worlds().length;

const clampWorld = (index: number): number => Math.min(Math.max(Math.floor(index), 0), getWorldCount() - 1);

export function getWorldStageRange(worldIndex: number): WorldStageRange {
  const list = worlds();
  const safe = clampWorld(worldIndex);
  let first = 0;

  for (let w = 0; w < safe; w++) {
    first += list[w]?.stages ?? 0;
  }

  const count = list[safe]?.stages ?? 0;

  return {first, last: first + Math.max(count, 1) - 1, count};
}

export function getWorldIndexForStage(stageIndex: number): number {
  const list = worlds();
  let acc = 0;

  for (let w = 0; w < list.length; w++) {
    const count = list[w].stages;

    if (stageIndex < acc + count) return w;

    acc += count;
  }

  return list.length - 1;
}

export const getWorld = (index: number): ModeWorld => worlds()[clampWorld(index)];

export const worldImagePath = (index: number): string => getWorld(index).image;

export const worldBackgroundPath = (index: number): string => getWorld(index).background;
