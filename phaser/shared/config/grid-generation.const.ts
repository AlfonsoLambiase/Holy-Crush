//* Da qui si sceglie quale griglia usare e si definiscono le generazioni (colonne x righe).
export type GridSize = {
  cols: number;
  rows: number;
};

export const GRID_GENERATIONS = {
  standard: {cols: 5, rows: 7},
} as const satisfies Record<string, GridSize>;

export type GridGenerationId = keyof typeof GRID_GENERATIONS;

export const ACTIVE_GRID_GENERATION: GridGenerationId = "standard";

export function getGridSize(generation: GridGenerationId = ACTIVE_GRID_GENERATION): GridSize {
  return GRID_GENERATIONS[generation];
}
