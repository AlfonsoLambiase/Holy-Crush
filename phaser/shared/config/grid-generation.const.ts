//* Generazioni della griglia e limiti. La cella è quadrata e si blocca sulla larghezza.
export type GridSize = {
  cols: number;
  rows: number;
};

export const GRID_LIMITS = {
  minCols: 1,
  maxCols: 6,
  minRows: 1,
  maxRows: 9,
} as const;

//* 5% per lato: la cella è la larghezza utile divisa per il massimo di colonne.
export const GRID_SIDE_MARGIN = 0.05;

//* L'obj sta nel block e scala insieme a lui.
export const GRID_PIECE_FIT = 0.9;

export const GRID_GENERATIONS = {
  standard: {cols: 6, rows: 9},
} as const satisfies Record<string, GridSize>;

export type GridGenerationId = keyof typeof GRID_GENERATIONS;

export const ACTIVE_GRID_GENERATION: GridGenerationId = "standard";

export function getCellSize(gameWidth: number): number {
  const usableWidth = gameWidth * (1 - GRID_SIDE_MARGIN * 2);

  return usableWidth / GRID_LIMITS.maxCols;
}

export function getGridSize(generation: GridGenerationId = ACTIVE_GRID_GENERATION): GridSize {
  const size = GRID_GENERATIONS[generation];
  const {minCols, maxCols, minRows, maxRows} = GRID_LIMITS;
  const colsOk = Number.isInteger(size.cols) && size.cols >= minCols && size.cols <= maxCols;
  const rowsOk = Number.isInteger(size.rows) && size.rows >= minRows && size.rows <= maxRows;

  if (!colsOk || !rowsOk) {
    throw new Error(
      `Griglia "${generation}" fuori limite: ${size.cols}x${size.rows}. Colonne ${minCols}-${maxCols}, righe ${minRows}-${maxRows}.`,
    );
  }

  return size;
}
