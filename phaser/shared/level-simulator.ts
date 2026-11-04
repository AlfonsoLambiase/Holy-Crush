import type {GridShape} from "../grid/create-grid";
import {getPieceKeysForStageLevel} from "@/settings/level-pieces";
import {getGameMode} from "@/settings/game-mode";
import {getLevelsInStage} from "./config/grid-generation.const";
import {
  listFiendCells,
  moveFiendObstacle,
  pickFiendSwapTarget,
  injectRuntimeFiends,
  isFiend,
  shuffleCells,
} from "./fiend";
import {
  missionForGrid,
  remainingOf,
  type GoalKind,
  type LevelMission,
  type MissionProgression,
} from "./level-mission";
import {
  collectBlasts,
  createEmptyBoard,
  EMPTY,
  findMatchRuns,
  hasMatches,
  hasValidMove,
  isPiece,
  isRegular,
  isSpecial,
  ROCKET_H,
  ROCKET_V,
  shuffleBoard,
  specialsFromRuns,
  swapCells,
  type Cell,
} from "./match3";
import {
  applyWave,
  blocksColumn,
  canPlaceThornAt,
  columnSegments,
  holdsPiece,
  listThornSpreads,
  obstacleFromSymbol,
  type ObstacleCell,
} from "./obstacles";

export type SimProgression = MissionProgression;

export type LevelSimState = {
  shape: GridShape;
  progression: SimProgression;
  board: number[][];
  obstacles: (ObstacleCell | null)[][];
  moves: number;
  collectLeft: number;
  mission: LevelMission;
  pieceKeys: readonly string[];
  rng: () => number;
};

export const createRng = (seed: number): (() => number) => {
  let s = seed >>> 0;

  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;

    return s / 0xffffffff;
  };
};

const cloneObstacles = (shape: GridShape): (ObstacleCell | null)[][] =>
  shape.cells.map((row) =>
    row.map((symbol) => (symbol === "." ? null : obstacleFromSymbol(symbol))),
  );

const allowsSwap = (obstacles: (ObstacleCell | null)[][], row: number, col: number): boolean => {
  const cell = obstacles[row]?.[col];

  return !!cell && cell.blocker === null && !(cell.lock && cell.lockLayers > 0);
};

const canMatch = (obstacles: (ObstacleCell | null)[][], row: number, col: number): boolean => {
  const cell = obstacles[row]?.[col];

  return !!cell && cell.blocker === null && cell.lock !== "ice";
};

const columnKind = (
  obstacles: (ObstacleCell | null)[][],
  row: number,
  col: number,
): "hole" | "block" | "mobile" => {
  const cell = obstacles[row]?.[col] ?? null;

  if (!cell) return "hole";
  if (blocksColumn(cell)) return "block";

  return "mobile";
};

const textureKey = (state: LevelSimState, type: number): string | null => {
  if (!isRegular(type)) return null;

  return state.pieceKeys[type] ?? null;
};

const collectHits = (state: LevelSimState, cells: Cell[]): number => {
  const icon = state.mission.goals.find((goal) => goal.kind === "collect")?.icon;

  if (!icon) return 0;

  return cells.reduce((total, cell) => {
    const type = state.board[cell.r]?.[cell.c];
    const key = type != null ? textureKey(state, type) : null;

    return key === icon ? total + 1 : total;
  }, 0);
};

const goalLeft = (state: LevelSimState, kind: GoalKind): number =>
  remainingOf(kind, state.obstacles, state.collectLeft);

export const goalsReached = (state: LevelSimState): boolean =>
  state.mission.goals.length > 0 &&
  state.mission.goals.every((goal) => goalLeft(state, goal.kind) <= 0);

const goalPressure = (state: LevelSimState): number =>
  state.mission.goals.reduce((sum, goal) => sum + goalLeft(state, goal.kind), 0);

const wouldMatchAt = (board: number[][], r: number, c: number, type: number): boolean => {
  if (c >= 2 && board[r][c - 1] === type && board[r][c - 2] === type) return true;
  if (r >= 2 && board[r - 1][c] === type && board[r - 2][c] === type) return true;

  return false;
};

const generatePlayableBoardSeeded = (
  state: LevelSimState,
): void => {
  const {shape, board, obstacles, pieceKeys, rng} = state;
  const rows = shape.rows;
  const cols = shape.cols;
  const typeCount = pieceKeys.length;
  const allows = (row: number, col: number) => allowsSwap(obstacles, row, col);
  const matchable = (row: number, col: number) => canMatch(obstacles, row, col);
  const isOpen = (row: number, col: number) => holdsPiece(obstacles[row]?.[col] ?? null);

  for (let attempt = 0; attempt < 80; attempt++) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!isOpen(r, c)) {
          board[r][c] = EMPTY;
          continue;
        }

        let type = Math.floor(rng() * typeCount);
        let guard = 0;

        while (wouldMatchAt(board, r, c, type) && guard < 24) {
          type = Math.floor(rng() * typeCount);
          guard++;
        }

        board[r][c] = type;
      }
    }

    if (!hasMatches(board, matchable) && hasValidMove(board, allows, matchable)) return;
  }
};

const uniqueCells = (cells: Cell[]): Cell[] => {
  const seen = new Set<string>();
  const out: Cell[] = [];

  for (const cell of cells) {
    const key = `${cell.r},${cell.c}`;

    if (seen.has(key)) continue;

    seen.add(key);
    out.push(cell);
  }

  return out;
};

const rocketOrigins = (board: number[][], cells: Cell[]): Cell[] =>
  cells.filter((cell) => {
    const type = board[cell.r][cell.c];

    return type === ROCKET_H || type === ROCKET_V;
  });

const collapseAndFill = (state: LevelSimState): void => {
  const {shape, board, obstacles, pieceKeys, rng} = state;
  const rows = shape.rows;
  const cols = shape.cols;

  for (let col = 0; col < cols; col++) {
    const segments = columnSegments(rows, (row) => columnKind(obstacles, row, col));

    for (const segment of segments) {
      const kept: number[] = [];

      for (const row of segment.slots) {
        if (board[row][col] !== EMPTY) kept.push(board[row][col]);

        board[row][col] = EMPTY;
      }

      for (let i = 0; i < kept.length; i++) {
        board[segment.slots[i]][col] = kept[i];
      }

      if (!segment.refill) continue;

      const missing = segment.slots.length - kept.length;

      for (let i = 0; i < missing; i++) {
        const row = segment.slots[kept.length + i];

        board[row][col] = Math.floor(rng() * pieceKeys.length);
      }
    }
  }
};

const growThorns = (state: LevelSimState): void => {
  const spreads = shuffleCells(listThornSpreads(state.obstacles, state.board, state.rng), state.rng);

  for (const spread of spreads) {
    if (!canPlaceThornAt(state.obstacles, state.board, spread.to)) continue;

    state.board[spread.to.r][spread.to.c] = EMPTY;
    const cell = state.obstacles[spread.to.r][spread.to.c];

    if (!cell) continue;

    cell.blocker = "thorn";
  }
};

const moveAllFiends = (state: LevelSimState): boolean => {
  const fiends = shuffleCells(listFiendCells(state.obstacles), state.rng);

  if (!fiends.length) return false;

  let moved = false;

  for (const from of fiends) {
    if (!isFiend(state.obstacles[from.r]?.[from.c])) continue;

    const to = pickFiendSwapTarget(state.obstacles, state.board, from, (row, col) =>
      allowsSwap(state.obstacles, row, col),
    );

    if (!to) continue;

    const type = state.board[to.r][to.c];

    if (type === EMPTY) continue;

    moveFiendObstacle(state.obstacles, from, to);
    state.board[from.r][from.c] = type;
    state.board[to.r][to.c] = EMPTY;
    moved = true;
  }

  if (!moved) return false;

  return hasMatches(state.board, (row, col) => canMatch(state.obstacles, row, col));
};

const resolveBoard = (
  state: LevelSimState,
  activated: Cell[] = [],
  preferred?: Cell,
  shouldGrowThorns = true,
  shouldMoveFiends = true,
): void => {
  let isFirstWave = true;
  let thornDamaged = false;
  const matchable = (row: number, col: number) => canMatch(state.obstacles, row, col);
  const allows = (row: number, col: number) => allowsSwap(state.obstacles, row, col);

  while (true) {
    const runs = findMatchRuns(state.board, matchable);
    const matches = runs.flatMap((run) => run.cells);
    const extra = isFirstWave ? activated : [];

    isFirstWave = false;

    if (matches.length === 0 && extra.length === 0) break;

    const spawns = matches.length ? specialsFromRuns(runs, preferred) : [];
    const spawnKeys = new Set(spawns.map((spawn) => `${spawn.cell.r},${spawn.cell.c}`));
    const uniqueMatches = uniqueCells(matches);
    const origins = uniqueCells(
      [...uniqueMatches, ...extra].filter((cell) => isSpecial(state.board[cell.r][cell.c])),
    );
    const {
      pop,
      thornDamaged: hit,
    } = applyWave(
      state.board,
      state.obstacles,
      uniqueMatches,
      collectBlasts(state.board, origins),
      spawnKeys,
    );

    if (hit) thornDamaged = true;

    if (pop.length) {
      state.collectLeft = Math.max(0, state.collectLeft - collectHits(state, pop));

      for (const cell of pop) {
        state.board[cell.r][cell.c] = EMPTY;
      }
    }

    for (const spawn of spawns) {
      state.board[spawn.cell.r][spawn.cell.c] = spawn.type;
    }

    if (goalsReached(state)) {
      collapseAndFill(state);

      return;
    }

    collapseAndFill(state);
  }

  if (goalsReached(state)) return;

  const stillPlaying = !goalsReached(state);

  if (shouldGrowThorns && stillPlaying && !thornDamaged) growThorns(state);

  if (shouldMoveFiends && stillPlaying && moveAllFiends(state)) {
    resolveBoard(state, [], undefined, false, false);
  }

  if (stillPlaying && !hasValidMove(state.board, allows, matchable)) {
    shuffleBoard(state.board, state.pieceKeys.length, allows, matchable);
  }
};

const canMove = (state: LevelSimState, cell: Cell): boolean =>
  allowsSwap(state.obstacles, cell.r, cell.c) && isPiece(state.board[cell.r][cell.c]);

const isAdjacent = (a: Cell, b: Cell): boolean =>
  Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

export const findAllSwapMoves = (state: LevelSimState): {a: Cell; b: Cell}[] => {
  const moves: {a: Cell; b: Cell}[] = [];
  const rows = state.shape.rows;
  const cols = state.shape.cols;
  const matchable = (row: number, col: number) => canMatch(state.obstacles, row, col);
  const allows = (row: number, col: number) => allowsSwap(state.obstacles, row, col);
  const seen = new Set<string>();

  const push = (a: Cell, b: Cell) => {
    const key = [`${a.r},${a.c}`, `${b.r},${b.c}`].sort().join("|");

    if (seen.has(key)) return;

    seen.add(key);
    moves.push({a, b});
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!canMove(state, {r, c})) continue;

      const neighbors: Cell[] = [
        {r, c: c + 1},
        {r: r + 1, c},
      ];

      if (isSpecial(state.board[r][c])) {
        const neighbor = neighbors.find((cell) => canMove(state, cell));

        if (neighbor) push({r, c}, neighbor);
      }

      if (canMove(state, {r, c: c + 1})) {
        swapCells(state.board, {r, c}, {r, c: c + 1});
        const hit = hasMatches(state.board, matchable) || isSpecial(state.board[r][c]) || isSpecial(state.board[r][c + 1]);

        swapCells(state.board, {r, c}, {r, c: c + 1});
        if (hit) push({r, c}, {r, c: c + 1});
      }

      if (canMove(state, {r: r + 1, c})) {
        swapCells(state.board, {r, c}, {r: r + 1, c});
        const hit = hasMatches(state.board, matchable) || isSpecial(state.board[r][c]) || isSpecial(state.board[r + 1][c]);

        swapCells(state.board, {r, c}, {r: r + 1, c});
        if (hit) push({r, c}, {r: r + 1, c});
      }
    }
  }

  return moves;
};

const trySwap = (state: LevelSimState, a: Cell, b: Cell): boolean => {
  if (!isAdjacent(a, b) || !canMove(state, a) || !canMove(state, b)) return false;

  swapCells(state.board, a, b);
  const activated = [a, b].filter((cell) => isSpecial(state.board[cell.r][cell.c]));
  const matchable = (row: number, col: number) => canMatch(state.obstacles, row, col);

  if (!hasMatches(state.board, matchable) && activated.length === 0) {
    swapCells(state.board, a, b);

    return false;
  }

  state.moves = Math.max(0, state.moves - 1);
  resolveBoard(state, activated, b);

  return true;
};

export const createLevelSimState = (
  shape: GridShape,
  progression: SimProgression,
  seed: number,
): LevelSimState => {
  const pieceKeys = getPieceKeysForStageLevel(progression.localLevel, progression.stageIndex);
  const mission = missionForGrid(shape.cells, pieceKeys[0] ?? "block", progression);
  const obstacles = cloneObstacles(shape);
  const board = createEmptyBoard(shape.rows, shape.cols);
  const rng = createRng(seed);
  const state: LevelSimState = {
    shape,
    progression,
    board,
    obstacles,
    moves: mission.moves,
    collectLeft: mission.collect,
    mission,
    pieceKeys,
    rng,
  };

  generatePlayableBoardSeeded(state);

  injectRuntimeFiends(state.obstacles, state.board, shape, {
    stageOneBased: progression.stageIndex + 1,
    stageIndex: progression.stageIndex,
    localLevel: progression.localLevel,
    levelsInStage: progression.levelsInStage,
    mode: getGameMode(),
  }, rng);

  for (let r = 0; r < shape.rows; r++) {
    for (let c = 0; c < shape.cols; c++) {
      if (isFiend(state.obstacles[r]?.[c])) state.board[r][c] = EMPTY;
    }
  }

  return state;
};

const cloneSimState = (state: LevelSimState): LevelSimState => ({
  ...state,
  board: state.board.map((row) => [...row]),
  obstacles: state.obstacles.map((row) =>
    row.map((cell) => (cell ? {...cell, terrainKind: cell.terrainKind} : null)),
  ),
});

/** Gioca mosse valide (niente booster) fino a vittoria o mosse esaurite. */
export const playLevelSim = (state: LevelSimState, smart = false): boolean => {
  let shuffles = 0;

  while (state.moves > 0 && !goalsReached(state)) {
    const moves = findAllSwapMoves(state);

    if (!moves.length) {
      shuffleBoard(
        state.board,
        state.pieceKeys.length,
        (row, col) => allowsSwap(state.obstacles, row, col),
        (row, col) => canMatch(state.obstacles, row, col),
      );
      shuffles++;

      if (shuffles > 12) break;

      continue;
    }

    shuffles = 0;

    let pick = moves[Math.floor(state.rng() * moves.length)];

    if (smart) {
      const before = goalPressure(state);
      let best = before;

      for (const move of moves) {
        const trial = cloneSimState(state);

        if (!trySwap(trial, move.a, move.b)) continue;

        const after = goalPressure(trial);

        if (after < best) {
          best = after;
          pick = move;
        }
      }
    }

    if (!trySwap(state, pick.a, pick.b)) break;
  }

  return goalsReached(state);
};

export const probeLevelSolvable = (
  shape: GridShape,
  progression: SimProgression,
  attempts = 64,
  startSeed = 1,
): boolean => {
  for (let i = 0; i < attempts; i++) {
    const state = createLevelSimState(shape, progression, startSeed + i * 7919);

    if (playLevelSim(state, i % 3 === 0)) return true;
  }

  return false;
};

export const staticLevelIssues = (
  shape: GridShape,
  progression: SimProgression,
): string[] => {
  const pieceKeys = getPieceKeysForStageLevel(progression.localLevel, progression.stageIndex);
  const mission = missionForGrid(shape.cells, pieceKeys[0] ?? "block", progression);
  const obstacles = cloneObstacles(shape);
  const issues: string[] = [];

  if (mission.moves < 1) issues.push("mosse=0");

  for (const goal of mission.goals) {
    const left = remainingOf(goal.kind, obstacles, mission.collect);

    if (left <= 0) issues.push(`obiettivo ${goal.kind} senza bersagli`);
  }

  const open = shape.cells.flat().filter((symbol) => symbol === "0").length;

  if (mission.collect > 0 && open === 0) issues.push("collect senza celle 0");

  if (mission.collect > open * 3) {
    issues.push(`collect ${mission.collect} alto rispetto celle ${open}`);
  }

  return issues;
};

export const progressionForGridId = (
  stageIndex: number,
  localLevel: number,
): SimProgression => ({
  stageIndex,
  localLevel,
  levelsInStage: getLevelsInStage(stageIndex),
});
