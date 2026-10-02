export const EMPTY = -1;
export const TYPE_COUNT = 4;
export const ROCKET_H = 100;
export const ROCKET_V = 101;
export const BOMB = 102;

export type Cell = {r: number; c: number};
export type MatchRun = {cells: Cell[]; dir: "h" | "v"};
export type SpecialSpawn = {cell: Cell; type: number};

export function isRegular(type: number): boolean {
  return type >= 0 && type < TYPE_COUNT;
}

export function isSpecial(type: number): boolean {
  return type === ROCKET_H || type === ROCKET_V || type === BOMB;
}

export function createEmptyBoard(rows: number, cols: number): number[][] {
  return Array.from({length: rows}, () => Array.from({length: cols}, () => EMPTY));
}

function randomType(typeCount: number): number {
  return Math.floor(Math.random() * typeCount);
}

function cellKey(cell: Cell): string {
  return `${cell.r},${cell.c}`;
}

function parseKey(key: string): Cell {
  const [r, c] = key.split(",").map(Number);

  return {r, c};
}

function inBounds(board: number[][], r: number, c: number): boolean {
  return r >= 0 && c >= 0 && r < board.length && c < board[0].length;
}

function wouldMatchAt(board: number[][], r: number, c: number, type: number): boolean {
  if (c >= 2 && board[r][c - 1] === type && board[r][c - 2] === type) return true;
  if (r >= 2 && board[r - 1][c] === type && board[r - 2][c] === type) return true;

  return false;
}

export function isAdjacent(a: Cell, b: Cell): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

export function swapCells(board: number[][], a: Cell, b: Cell): void {
  const tmp = board[a.r][a.c];

  board[a.r][a.c] = board[b.r][b.c];
  board[b.r][b.c] = tmp;
}

export function isPiece(type: number): boolean {
  return isRegular(type) || isSpecial(type);
}

function sameRegular(
  board: number[][],
  a: Cell,
  b: Cell,
  canMatch: (r: number, c: number) => boolean,
): boolean {
  if (!canMatch(a.r, a.c) || !canMatch(b.r, b.c)) return false;

  const typeA = board[a.r][a.c];
  const typeB = board[b.r][b.c];

  return isRegular(typeA) && typeA === typeB;
}

export function findMatchRuns(
  board: number[][],
  canMatch: (r: number, c: number) => boolean = () => true,
): MatchRun[] {
  const rows = board.length;
  const cols = board[0].length;
  const runs: MatchRun[] = [];

  for (let r = 0; r < rows; r++) {
    let run = 1;

    for (let c = 1; c <= cols; c++) {
      const same = c < cols && sameRegular(board, {r, c}, {r, c: c - 1}, canMatch);

      if (same) {
        run++;
        continue;
      }

      if (run >= 3 && isRegular(board[r][c - 1])) {
        const cells: Cell[] = [];

        for (let k = 0; k < run; k++) cells.push({r, c: c - 1 - k});
        runs.push({cells: cells.reverse(), dir: "h"});
      }

      run = 1;
    }
  }

  for (let c = 0; c < cols; c++) {
    let run = 1;

    for (let r = 1; r <= rows; r++) {
      const same = r < rows && sameRegular(board, {r, c}, {r: r - 1, c}, canMatch);

      if (same) {
        run++;
        continue;
      }

      if (run >= 3 && isRegular(board[r - 1][c])) {
        const cells: Cell[] = [];

        for (let k = 0; k < run; k++) cells.push({r: r - 1 - k, c});
        runs.push({cells: cells.reverse(), dir: "v"});
      }

      run = 1;
    }
  }

  return runs;
}

export function findMatches(
  board: number[][],
  canMatch: (r: number, c: number) => boolean = () => true,
): Cell[] {
  const matched = new Set<string>();

  for (const run of findMatchRuns(board, canMatch)) {
    for (const cell of run.cells) matched.add(cellKey(cell));
  }

  return [...matched].map(parseKey);
}

export function hasMatches(
  board: number[][],
  canMatch: (r: number, c: number) => boolean = () => true,
): boolean {
  return findMatches(board, canMatch).length > 0;
}

function pickRun(runs: MatchRun[], preferred?: Cell): MatchRun {
  const containing = preferred
    ? runs.find((run) => run.cells.some((cell) => cell.r === preferred.r && cell.c === preferred.c))
    : undefined;

  if (containing) return containing;

  return runs.reduce((best, run) => (run.cells.length > best.cells.length ? run : best));
}

function pickCell(run: MatchRun, preferred?: Cell): Cell {
  if (preferred && run.cells.some((cell) => cell.r === preferred.r && cell.c === preferred.c)) {
    return preferred;
  }

  return run.cells[Math.floor(run.cells.length / 2)];
}

function uniqueCellsFromRuns(runs: MatchRun[]): Cell[] {
  const seen = new Set<string>();
  const cells: Cell[] = [];

  for (const run of runs) {
    for (const cell of run.cells) {
      const key = cellKey(cell);

      if (seen.has(key)) continue;

      seen.add(key);
      cells.push(cell);
    }
  }

  return cells;
}

function runsShareCell(a: MatchRun, b: MatchRun): boolean {
  const keys = new Set(a.cells.map(cellKey));

  return b.cells.some((cell) => keys.has(cellKey(cell)));
}

function clusterRuns(runs: MatchRun[]): MatchRun[][] {
  const used = new Array(runs.length).fill(false);
  const clusters: MatchRun[][] = [];

  for (let i = 0; i < runs.length; i++) {
    if (used[i]) continue;

    const cluster = [runs[i]];

    used[i] = true;

    let grown = true;

    while (grown) {
      grown = false;

      for (let j = 0; j < runs.length; j++) {
        if (used[j]) continue;
        if (!cluster.some((run) => runsShareCell(run, runs[j]))) continue;

        cluster.push(runs[j]);
        used[j] = true;
        grown = true;
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

function pickClusterCell(runs: MatchRun[], preferred?: Cell): Cell {
  const cells = uniqueCellsFromRuns(runs);

  if (preferred && cells.some((cell) => cell.r === preferred.r && cell.c === preferred.c)) {
    return preferred;
  }

  const counts = new Map<string, number>();

  for (const run of runs) {
    for (const cell of run.cells) {
      const key = cellKey(cell);

      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const corner = [...counts.entries()].find(([, count]) => count > 1);

  if (corner) return parseKey(corner[0]);

  return cells[Math.floor(cells.length / 2)];
}

export function specialsFromRuns(runs: MatchRun[], preferred?: Cell): SpecialSpawn[] {
  const specials: SpecialSpawn[] = [];

  for (const cluster of clusterRuns(runs)) {
    const unique = uniqueCellsFromRuns(cluster);
    const longest = cluster.reduce((max, run) => Math.max(max, run.cells.length), 0);

    if (unique.length >= 5 || longest >= 5) {
      specials.push({cell: pickClusterCell(cluster, preferred), type: BOMB});
      continue;
    }

    if (longest === 4) {
      const fours = cluster.filter((run) => run.cells.length === 4);
      const run = pickRun(fours, preferred);

      specials.push({
        cell: pickCell(run, preferred),
        type: run.dir === "h" ? ROCKET_H : ROCKET_V,
      });
    }
  }

  return specials;
}

export function blastCells(board: number[][], cell: Cell, type: number): Cell[] {
  const rows = board.length;
  const cols = board[0].length;
  const cells: Cell[] = [];

  if (type === ROCKET_H) {
    for (let c = 0; c < cols; c++) cells.push({r: cell.r, c});

    return cells;
  }

  if (type === ROCKET_V) {
    for (let r = 0; r < rows; r++) cells.push({r, c: cell.c});

    return cells;
  }

  if (type === BOMB) {
    for (let r = cell.r - 1; r <= cell.r + 1; r++) {
      for (let c = cell.c - 1; c <= cell.c + 1; c++) {
        if (inBounds(board, r, c)) cells.push({r, c});
      }
    }
  }

  return cells;
}

//* Ogni potenziamento è un colpo a parte. Il muro resta nella linea: non ferma il razzo.
export function collectBlasts(board: number[][], origins: Cell[]): Cell[][] {
  const seen = new Set<string>();
  const queue: Cell[] = [];

  for (const origin of origins) {
    const key = cellKey(origin);

    if (seen.has(key)) continue;
    if (!inBounds(board, origin.r, origin.c) || !isSpecial(board[origin.r][origin.c])) continue;

    seen.add(key);
    queue.push(origin);
  }

  const blasts: Cell[][] = [];

  while (queue.length) {
    const cell = queue.shift()!;
    const blast = blastCells(board, cell, board[cell.r][cell.c]);

    blasts.push(blast);

    for (const hit of blast) {
      const key = cellKey(hit);

      if (seen.has(key)) continue;
      if (!inBounds(board, hit.r, hit.c) || !isSpecial(board[hit.r][hit.c])) continue;

      seen.add(key);
      queue.push(hit);
    }
  }

  return blasts;
}

export function expandDestroyed(board: number[][], seedCells: Cell[], activated: Cell[]): Cell[] {
  const destroy = new Set<string>();
  const queuedSpecials = new Set<string>();
  const queue: Cell[] = [];

  const addCell = (cell: Cell) => {
    if (!inBounds(board, cell.r, cell.c)) return;

    const key = cellKey(cell);

    if (destroy.has(key)) return;

    destroy.add(key);

    const type = board[cell.r][cell.c];

    if (isSpecial(type) && !queuedSpecials.has(key)) {
      queuedSpecials.add(key);
      queue.push(cell);
    }
  };

  for (const cell of seedCells) addCell(cell);
  for (const cell of activated) addCell(cell);

  while (queue.length) {
    const cell = queue.shift()!;
    const type = board[cell.r][cell.c];

    for (const blast of blastCells(board, cell, type)) addCell(blast);
  }

  return [...destroy].map(parseKey);
}

export function findHintMove(
  board: number[][],
  allowsSwap: (r: number, c: number) => boolean = () => true,
  canMatch: (r: number, c: number) => boolean = () => true,
): {a: Cell; b: Cell} | null {
  const rows = board.length;
  const cols = board[0].length;
  const movable = (cell: Cell) =>
    inBounds(board, cell.r, cell.c) && allowsSwap(cell.r, cell.c) && isPiece(board[cell.r][cell.c]);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!movable({r, c})) continue;

      const neighbors: Cell[] = [
        {r, c: c + 1},
        {r: r + 1, c},
        {r, c: c - 1},
        {r: r - 1, c},
      ];

      if (isSpecial(board[r][c])) {
        const neighbor = neighbors.find((cell) => movable(cell));

        if (neighbor) return {a: {r, c}, b: neighbor};
      }

      if (movable({r, c: c + 1})) {
        swapCells(board, {r, c}, {r, c: c + 1});
        const hit = hasMatches(board, canMatch);

        swapCells(board, {r, c}, {r, c: c + 1});
        if (hit) return {a: {r, c}, b: {r, c: c + 1}};
      }

      if (movable({r: r + 1, c})) {
        swapCells(board, {r, c}, {r: r + 1, c});
        const hit = hasMatches(board, canMatch);

        swapCells(board, {r, c}, {r: r + 1, c});
        if (hit) return {a: {r, c}, b: {r: r + 1, c}};
      }
    }
  }

  return null;
}

export function hasValidMove(
  board: number[][],
  allowsSwap: (r: number, c: number) => boolean = () => true,
  canMatch: (r: number, c: number) => boolean = () => true,
): boolean {
  return findHintMove(board, allowsSwap, canMatch) !== null;
}

export function generatePlayableBoard(
  rows: number,
  cols: number,
  typeCount: number,
  isOpen: (row: number, col: number) => boolean = () => true,
  allowsSwap: (row: number, col: number) => boolean = () => true,
  canMatch: (row: number, col: number) => boolean = () => true,
): number[][] {
  let board = createEmptyBoard(rows, cols);

  for (let attempt = 0; attempt < 80; attempt++) {
    board = createEmptyBoard(rows, cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!isOpen(r, c)) continue;

        let type = randomType(typeCount);
        let guard = 0;

        while (wouldMatchAt(board, r, c, type) && guard < 24) {
          type = randomType(typeCount);
          guard++;
        }

        board[r][c] = type;
      }
    }

    if (!hasMatches(board, canMatch) && hasValidMove(board, allowsSwap, canMatch)) return board;
  }

  return board;
}

export function shuffleBoard(
  board: number[][],
  _typeCount: number,
  allowsSwap: (r: number, c: number) => boolean = () => true,
  canMatch: (r: number, c: number) => boolean = () => true,
): void {
  const rows = board.length;
  const cols = board[0].length;
  const mobile: Cell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (allowsSwap(r, c) && isPiece(board[r][c])) mobile.push({r, c});
    }
  }

  if (mobile.length < 2) return;

  const original = mobile.map((cell) => board[cell.r][cell.c]);

  const apply = (types: number[]) => {
    mobile.forEach((cell, index) => {
      board[cell.r][cell.c] = types[index];
    });
  };

  for (let attempt = 0; attempt < 80; attempt++) {
    const types = [...original];

    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = types[i];

      types[i] = types[j];
      types[j] = tmp;
    }

    apply(types);

    if (!hasMatches(board, canMatch) && hasValidMove(board, allowsSwap, canMatch)) return;
  }

  apply(original);
}
