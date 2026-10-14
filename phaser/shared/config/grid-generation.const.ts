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
import {GRID_0010} from "../../grid/grid-0010";
import {GRID_0011} from "../../grid/grid-0011";
import {GRID_0012} from "../../grid/grid-0012";
import {GRID_0013} from "../../grid/grid-0013";
import {GRID_0014} from "../../grid/grid-0014";
import {GRID_0015} from "../../grid/grid-0015";
import {GRID_0016} from "../../grid/grid-0016";
import {GRID_0017} from "../../grid/grid-0017";
import {GRID_0018} from "../../grid/grid-0018";
import {GRID_0019} from "../../grid/grid-0019";

//* Limiti della griglia e dimensione del blocco. Si cambia solo qui.
export const GRID_LIMITS = {
  minCols: 1,
  maxCols: 8,
  minRows: 1,
  maxRows: 10,
  //* Quanti blocchi entrano nella larghezza. 8 più grandi, 9 più piccoli.
  blockSizeColumns: 8,
} as const;

//* 5% per lato.
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
  "grid-0010": createGrid("grid-0010", GRID_0010),
  "grid-0011": createGrid("grid-0011", GRID_0011),
  "grid-0012": createGrid("grid-0012", GRID_0012),
  "grid-0013": createGrid("grid-0013", GRID_0013),
  "grid-0014": createGrid("grid-0014", GRID_0014),
  "grid-0015": createGrid("grid-0015", GRID_0015),
  "grid-0016": createGrid("grid-0016", GRID_0016),
  "grid-0017": createGrid("grid-0017", GRID_0017),
  "grid-0018": createGrid("grid-0018", GRID_0018),
  "grid-0019": createGrid("grid-0019", GRID_0019),
} as const;

export type GridId = keyof typeof GRIDS;

//* Il bottone della mappa sceglie il disegno. 1 è grid-0000, 20 è grid-0019. Ogni stage riusa le stesse 20.
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
  11: "grid-0010",
  12: "grid-0011",
  13: "grid-0012",
  14: "grid-0013",
  15: "grid-0014",
  16: "grid-0015",
  17: "grid-0016",
  18: "grid-0017",
  19: "grid-0018",
  20: "grid-0019",
} as const satisfies Record<number, GridId>;

export function getCellSize(gameWidth: number): number {
  const usableWidth = gameWidth * (1 - GRID_SIDE_MARGIN * 2);

  return usableWidth / GRID_LIMITS.blockSizeColumns;
}

const LEVEL_GRID_COUNT = Object.keys(LEVEL_GRIDS).length;

//* Oltre il 20 (stage da 50 livelli) i disegni ripartono dal primo
export function getGridForLevel(level: number): GridShape {
  const cycled = ((Math.max(1, Math.floor(level)) - 1) % LEVEL_GRID_COUNT) + 1;
  const id = LEVEL_GRIDS[cycled as keyof typeof LEVEL_GRIDS] ?? "grid-0019";
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
