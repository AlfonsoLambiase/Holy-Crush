import {createGrid, type GridShape} from "../../grid/create-grid";
import {GRID_0000} from "../../grid/grid-0000";
import {GRID_0001} from "../../grid/grid-0001";

//* Generazioni della griglia e limiti. La cella è quadrata e si blocca sulla larghezza.
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

const GRIDS = {
  "grid-0000": createGrid("grid-0000", GRID_0000),
  "grid-0001": createGrid("grid-0001", GRID_0001),
} as const;

export type GridId = keyof typeof GRIDS;

//* Il livello in mappa (1-5) sceglie quale disegno creare.
export const LEVEL_GRIDS = {
  1: "grid-0001",
  2: "grid-0000",
  3: "grid-0000",
  4: "grid-0000",
  5: "grid-0000",
} as const satisfies Record<number, GridId>;

export function getCellSize(gameWidth: number): number {
  const usableWidth = gameWidth * (1 - GRID_SIDE_MARGIN * 2);

  return usableWidth / GRID_LIMITS.maxCols;
}

export function getGridForLevel(level: number): GridShape {
  const id = LEVEL_GRIDS[level as keyof typeof LEVEL_GRIDS] ?? "grid-0000";
  const shape = GRIDS[id];
  const {minCols, maxCols, minRows, maxRows} = GRID_LIMITS;
  const colsOk = shape.cols >= minCols && shape.cols <= maxCols;
  const rowsOk = shape.rows >= minRows && shape.rows <= maxRows;

  if (!colsOk || !rowsOk) {
    throw new Error(
      `Griglia "${id}" fuori limite: ${shape.cols}x${shape.rows}. Colonne ${minCols}-${maxCols}, righe ${minRows}-${maxRows}.`,
    );
  }

  return shape;
}
