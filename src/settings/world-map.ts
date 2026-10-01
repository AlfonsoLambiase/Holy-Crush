export const WORLD_COUNT = 5;

/** Stage per mondo (totale 20): 4 + 3 + 6 + 5 + 2. */
export const WORLD_STAGE_COUNTS = [4, 3, 6, 5, 2] as const;

export type WorldStageRange = {
  first: number;
  last: number;
  count: number;
};

export function getWorldStageRange(worldIndex: number): WorldStageRange {
  const safe = Math.min(Math.max(worldIndex, 0), WORLD_COUNT - 1);
  let first = 0;

  for (let w = 0; w < safe; w++) {
    first += WORLD_STAGE_COUNTS[w] ?? 0;
  }

  const count = WORLD_STAGE_COUNTS[safe] ?? 0;

  return {first, last: first + Math.max(count, 1) - 1, count};
}

export function getWorldIndexForStage(stageIndex: number): number {
  let acc = 0;

  for (let w = 0; w < WORLD_COUNT; w++) {
    const count = WORLD_STAGE_COUNTS[w] ?? 0;

    if (stageIndex < acc + count) return w;

    acc += count;
  }

  return WORLD_COUNT - 1;
}

export function worldImagePath(index: number): string {
  return `/world/world_${index}.png`;
}

export function worldBackgroundPath(index: number): string {
  const safe = Math.min(Math.max(Math.floor(index), 0), WORLD_COUNT - 1);

  return `/world/world_bg_${safe}.png`;
}
