import {createGrid, type GridShape} from "../../grid/create-grid";
import {STAGE_01} from "../../grid/stage-01";
import {STAGE_02} from "../../grid/stage-02";
import {STAGE_03} from "../../grid/stage-03";
import {STAGE_04} from "../../grid/stage-04";
import {STAGE_05} from "../../grid/stage-05";
import {STAGE_06} from "../../grid/stage-06";
import {STAGE_07} from "../../grid/stage-07";
import {STAGE_08} from "../../grid/stage-08";
import {STAGE_09} from "../../grid/stage-09";
import {STAGE_10} from "../../grid/stage-10";
import {STAGE_11} from "../../grid/stage-11";
import {STAGE_12} from "../../grid/stage-12";
import {STAGE_13} from "../../grid/stage-13";
import {STAGE_14} from "../../grid/stage-14";
import {STAGE_15} from "../../grid/stage-15";
import {STAGE_16} from "../../grid/stage-16";
import {STAGE_17} from "../../grid/stage-17";
import {STAGE_18} from "../../grid/stage-18";
import {STAGE_19} from "../../grid/stage-19";
import {STAGE_20} from "../../grid/stage-20";

//* Limiti della griglia e dimensione del blocco. Si cambia solo qui.
export const GRID_LIMITS = {
  minCols: 1,
  maxCols: 7,
  minRows: 1,
  maxRows: 10,
  //* Quanti blocchi entrano nella larghezza. 8 più grandi, 9 più piccoli.
  blockSizeColumns: 7,
} as const;

//* 5% per lato.
export const GRID_SIDE_MARGIN = 0.05;

//* L'obj sta nel block e scala insieme a lui.
export const GRID_PIECE_FIT = 0.9;

const STAGES = [
  STAGE_01,
  STAGE_02,
  STAGE_03,
  STAGE_04,
  STAGE_05,
  STAGE_06,
  STAGE_07,
  STAGE_08,
  STAGE_09,
  STAGE_10,
  STAGE_11,
  STAGE_12,
  STAGE_13,
  STAGE_14,
  STAGE_15,
  STAGE_16,
  STAGE_17,
  STAGE_18,
  STAGE_19,
  STAGE_20,
] as const;

const gridId = (stagePos: number, levelsInStage: number, local: number): string =>
  `grid-${String(stagePos * levelsInStage + local).padStart(4, "0")}`;

export function getCellSize(gameWidth: number): number {
  const usableWidth = gameWidth * (1 - GRID_SIDE_MARGIN * 2);

  return usableWidth / GRID_LIMITS.blockSizeColumns;
}

//* stageIndex parte da 0. Oltre i 20 livelli dello stage, i disegni ripartono dal primo.
export function getGridForLevel(level: number, stageIndex = 0): GridShape {
  const stageCount = STAGES.length;
  const stagePos = ((Math.floor(stageIndex) % stageCount) + stageCount) % stageCount;
  const levels = STAGES[stagePos];
  const local = (Math.max(1, Math.floor(level)) - 1) % levels.length;
  const id = gridId(stagePos, levels.length, local);
  const shape = createGrid(id, levels[local]);
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

export type ListedGrid = GridShape & {stageIndex: number; localLevel: number};

//* Tutte le griglie, da grid-0000 all'ultima, nello stesso ordine del gioco.
export function listAllGrids(): ListedGrid[] {
  return STAGES.flatMap((levels, stagePos) =>
    levels.map((pattern, local) => ({
      ...createGrid(gridId(stagePos, levels.length, local), pattern),
      stageIndex: stagePos,
      localLevel: local + 1,
    })),
  );
}
