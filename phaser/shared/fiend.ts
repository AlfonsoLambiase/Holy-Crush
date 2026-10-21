import type {GridShape} from "../grid/create-grid";
import type {GameModeId} from "@/settings/game-mode";

import {EMPTY, isRegular, type Cell} from "./match3";
import type {ObstacleCell} from "./obstacles";

export const FIEND_VARIANTS = 5;

export function fiendCoverKey(variant: number): string {
  const v = Math.max(0, Math.min(FIEND_VARIANTS - 1, Math.floor(variant)));

  return `Z_${v}`;
}

export function isFiend(cell: ObstacleCell | null | undefined): boolean {
  return cell?.blocker === "fiend";
}

export function randomFiendVariant(rand: () => number = Math.random): number {
  return Math.floor(rand() * FIEND_VARIANTS);
}

export function makeFiendCell(variant?: number): ObstacleCell {
  return {
    lock: null,
    lockLayers: 0,
    terrain: 0,
    terrainKind: null,
    blocker: "fiend",
    blockerLayers: variant ?? randomFiendVariant(),
  };
}

const rowFills = (rows: readonly string[]) =>
  rows.map((row) => [...row].filter((c) => c !== ".").length);

export const isCrossShape = (rows: readonly string[]): boolean => {
  const fills = rowFills(rows).filter((n) => n > 0);

  if (fills.length < 3) return false;

  const max = Math.max(...fills);
  const min = Math.min(...fills);

  if (max - min < 2) return false;

  const narrow = fills.filter((n) => n <= min + 1).length;
  const wide = fills.filter((n) => n >= max - 1).length;

  return narrow >= 2 && wide >= 1;
};

export const isLargeGrid = (rows: readonly string[]): boolean => {
  const rowsN = rows.length;
  const colsN = rows[0]?.length ?? 0;
  const playable = rows.reduce((sum, row) => sum + [...row].filter((c) => c !== ".").length, 0);

  return rowsN * colsN >= 48 || playable >= 40 || (rowsN >= 9 && colsN >= 6);
};

export function gridAllowsFiendCount(shape: GridShape, totalFiends: number): boolean {
  if (totalFiends <= 3) return true;

  const rows = shape.cells.map((row) => row.join(""));

  return isLargeGrid(rows) && !isCrossShape(rows);
}

/** Stage di gioco 1-based (come getStageIndex() + 1). */
export function maxFiendsForStage(stageOneBased: number, mode: GameModeId): number {
  const s = Math.max(1, stageOneBased);

  if (mode === 1) {
    if (s < 3) return 1;
    if (s < 5) return 2;
    if (s < 8) return 3;
    if (s < 10) return 4;

    return 5;
  }

  if (s < 3) return 1;
  if (s < 5) return 2;
  if (s < 10) return 3;
  if (s < 18) return 4;

  return 5;
}

export function canIntroduceFiends(
  stageIndex: number,
  localLevel: number,
  levelsInStage: number,
): boolean {
  if (stageIndex > 0) return true;

  return localLevel > Math.floor(levelsInStage / 2);
}

export function countFiends(obstacles: (ObstacleCell | null)[][]): number {
  let n = 0;

  for (const row of obstacles) {
    for (const cell of row) {
      if (isFiend(cell)) n++;
    }
  }

  return n;
}

export type PlayableBorderSides = {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
};

/** Lato “aperto” = buco o fuori griglia → lo spostamento non va verso quel lato. */
export function playableBorderSides(
  obstacles: (ObstacleCell | null)[][],
  cell: Cell,
): PlayableBorderSides {
  const open = (r: number, c: number) => obstacles[r]?.[c] != null;

  return {
    left: !open(cell.r, cell.c - 1),
    right: !open(cell.r, cell.c + 1),
    top: !open(cell.r - 1, cell.c),
    bottom: !open(cell.r + 1, cell.c),
  };
}

export function listFiendCells(obstacles: (ObstacleCell | null)[][]): Cell[] {
  const out: Cell[] = [];

  for (let r = 0; r < obstacles.length; r++) {
    for (let c = 0; c < (obstacles[0]?.length ?? 0); c++) {
      if (isFiend(obstacles[r]?.[c])) out.push({r, c});
    }
  }

  return out;
}

export function pickFiendSwapTarget(
  obstacles: (ObstacleCell | null)[][],
  board: number[][],
  from: Cell,
  allowsSwap: (row: number, col: number) => boolean,
  rand: () => number = Math.random,
): Cell | null {
  const rows = obstacles.length;
  const cols = obstacles[0]?.length ?? 0;
  const border = playableBorderSides(obstacles, from);

  const collect = (useRow: boolean): Cell[] => {
    const candidates: Cell[] = [];

    if (useRow) {
      for (const dc of [-1, 1] as const) {
        if (border.left && dc < 0) continue;
        if (border.right && dc > 0) continue;

        const c = from.c + dc;

        if (c < 0 || c >= cols) continue;
        if (!allowsSwap(from.r, c)) continue;
        if (isFiend(obstacles[from.r]?.[c])) continue;
        if (!isRegular(board[from.r][c])) continue;

        candidates.push({r: from.r, c});
      }
    } else {
      for (const dr of [-1, 1] as const) {
        if (border.top && dr < 0) continue;
        if (border.bottom && dr > 0) continue;

        const r = from.r + dr;

        if (r < 0 || r >= rows) continue;
        if (!allowsSwap(r, from.c)) continue;
        if (isFiend(obstacles[r]?.[from.c])) continue;
        if (!isRegular(board[r][from.c])) continue;

        candidates.push({r, c: from.c});
      }
    }

    return candidates;
  };

  const axes = rand() < 0.5 ? [true, false] : [false, true];

  for (const axis of axes) {
    const candidates = collect(axis);

    if (candidates.length) return candidates[Math.floor(rand() * candidates.length)];
  }

  return null;
}

export function shuffleCells<T>(cells: T[], rand: () => number = Math.random): T[] {
  const copy = [...cells];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export type FiendInjectContext = {
  stageOneBased: number;
  stageIndex: number;
  localLevel: number;
  levelsInStage: number;
  mode: GameModeId;
};

/** Aggiunge fiend fino al cap; modifica ostacoli e board (svuota celle occupate). */
export function injectRuntimeFiends(
  obstacles: (ObstacleCell | null)[][],
  board: number[][],
  shape: GridShape,
  ctx: FiendInjectContext,
  rand: () => number = Math.random,
): number {
  if (!canIntroduceFiends(ctx.stageIndex, ctx.localLevel, ctx.levelsInStage)) return 0;

  const max = maxFiendsForStage(ctx.stageOneBased, ctx.mode);
  const existing = countFiends(obstacles);

  if (existing >= max) return 0;

  const target = existing + 1 + Math.floor(rand() * (max - existing));
  const need = target - existing;

  if (need <= 0) return 0;

  const rows = obstacles.length;
  const cols = obstacles[0]?.length ?? 0;
  const slots: Cell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = obstacles[r]?.[c];

      if (!cell || cell.blocker !== null) continue;
      if (!isRegular(board[r][c])) continue;

      slots.push({r, c});
    }
  }

  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));

    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  let placed = 0;

  for (const slot of slots) {
    if (placed >= need) break;

    const total = countFiends(obstacles);

    if (total >= max) break;
    if (!gridAllowsFiendCount(shape, total + 1)) break;

    const obs = obstacles[slot.r][slot.c];

    if (!obs) continue;

    obs.blocker = "fiend";
    obs.blockerLayers = randomFiendVariant(rand);
    board[slot.r][slot.c] = EMPTY;
    placed++;
  }

  return placed;
}

export function clearFiendAt(obstacles: (ObstacleCell | null)[][], cell: Cell): void {
  const obs = obstacles[cell.r]?.[cell.c];

  if (!obs || !isFiend(obs)) return;

  obs.blocker = null;
  obs.blockerLayers = 0;
}

export function moveFiendObstacle(
  obstacles: (ObstacleCell | null)[][],
  from: Cell,
  to: Cell,
): void {
  const source = obstacles[from.r]?.[from.c];
  const target = obstacles[to.r]?.[to.c];

  if (!source || !target || !isFiend(source)) return;

  const variant = source.blockerLayers;

  source.blocker = null;
  source.blockerLayers = 0;
  target.blocker = "fiend";
  target.blockerLayers = variant;
}

export function fiendKeysInShape(cells: readonly (readonly string[])[]): number {
  let n = 0;

  for (const row of cells) {
    for (const symbol of row) {
      if (symbol === "Z") n++;
    }
  }

  return n;
}
