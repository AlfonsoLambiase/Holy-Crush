import {createGrid, type GridShape} from "../../grid/create-grid";
import {GRID_0000} from "../../grid/grid-0000";
import {GRID_0001} from "../../grid/grid-0001";
import {GRID_0002} from "../../grid/grid-0002";
import {GRID_0003} from "../../grid/grid-0003";
import {GRID_0004} from "../../grid/grid-0004";
import {GRID_0005} from "../../grid/grid-0005";
import {GRID_0006} from "../../grid/grid-0006";
import {GRID_0007} from "../../grid/grid-0007";
import {GRID_0008} from "../../grid/grid-0008";
import {GRID_0009} from "../../grid/grid-0009";

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
  "grid-0002": createGrid("grid-0002", GRID_0002),
  "grid-0003": createGrid("grid-0003", GRID_0003),
  "grid-0004": createGrid("grid-0004", GRID_0004),
  "grid-0005": createGrid("grid-0005", GRID_0005),
  "grid-0006": createGrid("grid-0006", GRID_0006),
  "grid-0007": createGrid("grid-0007", GRID_0007),
  "grid-0008": createGrid("grid-0008", GRID_0008),
  "grid-0009": createGrid("grid-0009", GRID_0009),
} as const;

export type GridId = keyof typeof GRIDS;

//* Il numero sul bottone della mappa sceglie il disegno. 1 è il più piccolo, 10 è grid-0009.
export const LEVEL_GRIDS = {
  1: "grid-0000",
  2: "grid-0001",
  3: "grid-0002",
  4: "grid-0003",
  5: "grid-0004",
  6: "grid-0005",
  7: "grid-0006",
  8: "grid-0007",
  9: "grid-0008",
  10: "grid-0009",
} as const satisfies Record<number, GridId>;

export function getCellSize(gameWidth: number): number {
  const usableWidth = gameWidth * (1 - GRID_SIDE_MARGIN * 2);

  return usableWidth / GRID_LIMITS.maxCols;
}

export function getGridForLevel(level: number): GridShape {
  const id = LEVEL_GRIDS[level as keyof typeof LEVEL_GRIDS] ?? "grid-0009";
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
