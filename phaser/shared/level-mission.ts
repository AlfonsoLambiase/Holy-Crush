import type {GridSymbol} from "../grid/create-grid";
import {STAGE_01_TWO_GOALS_FROM_LOCAL_LEVEL} from "../grid/stage-01/mission.const";
import type {ObstacleCell} from "./obstacles";

//* Una sola continuazione a partita. Il testo movesOutBody dice lo stesso numero.
export const EXTRA_MOVES = 10;

export type GoalKind = "collect" | "ice" | "chain" | "crate" | "terrain" | "rock" | "thorn";

export type MissionGoal = {
  kind: GoalKind;
  icon: string;
};

export type LevelMission = {
  moves: number;
  goals: MissionGoal[];
  collect: number;
};

export type MissionProgression = {
  /** Stage corrente, 0-based. */
  stageIndex: number;
  /** Livello 1-based dentro lo stage (1 … levelsInStage). */
  localLevel: number;
  levelsInStage: number;
};

const OBSTACLE: Record<Exclude<GoalKind, "collect">, readonly string[]> = {
  ice: ["I", "J"],
  chain: ["L"],
  crate: ["B", "C", "D"],
  terrain: ["G", "H"],
  rock: ["R"],
  thorn: ["V"],
};

const OBSTACLE_KINDS = Object.keys(OBSTACLE) as Exclude<GoalKind, "collect">[];

/** Ostacoli avanzati (stage alti): posizione fissa da evidenziare nel browser griglie. */
export const SPECIAL_OBJECTIVE_SYMBOLS = new Set<GridSymbol>([
  "H",
  "J",
  "C",
  "D",
  "L",
  "R",
  "V",
  "X",
  "Z",
]);

export function goalKindForObstacleSymbol(
  symbol: GridSymbol,
): Exclude<GoalKind, "collect"> | null {
  if (symbol === ".") return null;

  for (const kind of OBSTACLE_KINDS) {
    if (OBSTACLE[kind].includes(symbol)) return kind;
  }

  return null;
}

export function isSpecialObjectiveSymbol(symbol: GridSymbol): boolean {
  return SPECIAL_OBJECTIVE_SYMBOLS.has(symbol);
}

export function hasFixedObjectivePosition(kind: GoalKind): boolean {
  return kind !== "collect";
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const has = (cells: GridSymbol[][], symbol: string): boolean =>
  cells.some((row) => row.includes(symbol as GridSymbol));

const countSymbol = (cells: GridSymbol[][], symbols: readonly string[]): number =>
  cells.reduce(
    (total, row) => total + row.filter((cell) => symbols.includes(cell)).length,
    0,
  );

const levelProgress = ({localLevel, levelsInStage}: MissionProgression): number =>
  (Math.max(1, localLevel) - 1) / Math.max(1, levelsInStage - 1);

/** Stage 1 → 1 obiettivo, stage 2 → 2, stage 3 → 3, stage 4+ → 4. */
export const goalCountForStage = (stageIndex: number): number =>
  clamp(stageIndex + 1, 1, 4);

export const goalCountForProgression = (progression: MissionProgression): number => {
  if (
    progression.stageIndex === 0 &&
    progression.localLevel >= STAGE_01_TWO_GOALS_FROM_LOCAL_LEVEL
  ) {
    return 2;
  }

  return goalCountForStage(progression.stageIndex);
};

//* Icona dell'ostacolo più duro presente, così il giocatore riconosce il disegno.
const iconFor = (kind: Exclude<GoalKind, "collect">, cells: GridSymbol[][]): string => {
  const symbols = OBSTACLE[kind];

  for (let index = symbols.length - 1; index >= 0; index--) {
    if (has(cells, symbols[index])) return symbols[index];
  }

  return symbols[0];
};

const baseMoves = (rows: number, obstacles: number, hasObstacleGoals: boolean): number => {
  if (!hasObstacleGoals) return clamp(18 + rows, 20, 28);

  return clamp(16 + rows + obstacles * 2, 18, 42);
};

const scaleCollectTarget = (
  open: number,
  progression: MissionProgression,
  goalCount: number,
): number => {
  const base = clamp(Math.round(open * 0.45), 8, 16);

  if (progression.stageIndex === 0) return base;

  const progress = levelProgress(progression);
  const stageBoost = Math.max(0, progression.stageIndex - 1);
  const goalsBoost = Math.max(0, goalCount - 1) * 0.08;
  const scale = 1 + stageBoost * 0.1 + progress * 0.22 + goalsBoost;

  return clamp(Math.round(base * scale), 1, 36);
};

const scaleMoves = (
  moves: number,
  progression: MissionProgression,
  goalCount: number,
): number => {
  if (progression.stageIndex === 0) return moves;

  const progress = levelProgress(progression);
  const stagePenalty = progression.stageIndex * 2;
  const levelPenalty = Math.round(progress * (3 + progression.stageIndex * 1.2));
  const goalsPenalty = Math.max(0, goalCount - 1);

  return clamp(moves - stagePenalty - levelPenalty - goalsPenalty, 11, 42);
};

/** Punteggio “carico di lavoro” del livello (obiettivi + ostacoli duri), non la forma. */
const complexityScore = (
  cells: GridSymbol[][],
  goals: MissionGoal[],
  collect: number,
): number => {
  let score = Math.max(0, goals.length - 2) * 3;

  if (collect >= 30) score += 8;
  else if (collect >= 26) score += 6;
  else if (collect >= 22) score += 5;
  else if (collect >= 18) score += 4;
  else if (collect >= 14) score += 3;
  else if (collect >= 11) score += 2;

  score += Math.min(4, countSymbol(cells, ["J", "C", "D", "H"]));
  score += Math.min(3, countSymbol(cells, ["V", "Z"]));
  score += Math.min(2, countSymbol(cells, ["X", "R", "L"]));

  const kinds = new Set(goals.map((goal) => goal.kind));

  if (kinds.has("thorn")) score += 2;
  if (kinds.has("terrain") && has(cells, "H")) score += 2;

  return score;
};

/** Stage 6–20: qualche mossa in più solo sui livelli davvero pieni. Stage 5: eccezione rara (es. grid-0085). */
const bonusMovesForComplexity = (
  cells: GridSymbol[][],
  progression: MissionProgression,
  goals: MissionGoal[],
  collect: number,
): number => {
  const score = complexityScore(cells, goals, collect);
  const stage = progression.stageIndex;

  if (stage >= 5) {
    if (score < 6) return 0;
    if (score < 10) return 3;
    if (score < 14) return 5;
    if (score < 18) return 7;

    return 9;
  }

  if (stage === 4 && goals.length >= 4 && score >= 10) return 3;

  return 0;
};

/** Collect molto alto negli stage avanzati: minimo di mosse, senza regalare la vittoria. */
const minimumMovesForHeavyCollect = (
  progression: MissionProgression,
  collect: number,
): number => {
  if (progression.stageIndex < 5 || collect < 22) return 0;
  if (collect >= 32) return 26;
  if (collect >= 28) return 24;
  if (collect >= 24) return 21;

  return 19;
};

/** Quattro obiettivi solo ostacoli (niente raccolta): serve più margine negli stage alti. */
const minimumMovesForObstacleOnlyGoals = (
  progression: MissionProgression,
  goals: MissionGoal[],
  collect: number,
): number => {
  if (progression.stageIndex < 7 || collect > 0 || goals.length < 4) return 0;

  return clamp(17 + Math.floor((progression.stageIndex - 6) / 2), 17, 22);
};

const buildGoals = (
  cells: GridSymbol[][],
  pieceIcon: string,
  progression: MissionProgression,
): MissionGoal[] => {
  const goalCount = goalCountForProgression(progression);
  const ranked = OBSTACLE_KINDS.map((kind) => ({
    kind,
    total: countSymbol(cells, OBSTACLE[kind]),
  }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);

  const open = countSymbol(cells, ["0"]);
  const available: MissionGoal[] = ranked.map((entry) => ({
    kind: entry.kind,
    icon: iconFor(entry.kind, cells),
  }));

  if (open > 0) {
    available.push({kind: "collect", icon: pieceIcon});
  }

  if (available.length === 0) {
    return [];
  }

  return available.slice(0, goalCount);
};

export function missionForGrid(
  cells: GridSymbol[][],
  pieceIcon: string,
  progression: MissionProgression,
): LevelMission {
  const rows = cells.length;
  const ranked = OBSTACLE_KINDS.map((kind) => ({
    kind,
    total: countSymbol(cells, OBSTACLE[kind]),
  })).filter((entry) => entry.total > 0);
  const obstacles = ranked.reduce((total, entry) => total + entry.total, 0);
  const goals = buildGoals(cells, pieceIcon, progression);
  const hasCollect = goals.some((goal) => goal.kind === "collect");
  const open = countSymbol(cells, ["0"]);
  const hasObstacleGoals = goals.some((goal) => goal.kind !== "collect");

  let moves = baseMoves(rows, obstacles, hasObstacleGoals || ranked.length > 0);

  moves = scaleMoves(moves, progression, goals.length);

  const collect = hasCollect ? scaleCollectTarget(open, progression, goals.length) : 0;

  moves += bonusMovesForComplexity(cells, progression, goals, collect);
  moves = Math.max(moves, minimumMovesForHeavyCollect(progression, collect));
  moves = Math.max(moves, minimumMovesForObstacleOnlyGoals(progression, goals, collect));
  moves = clamp(moves, 11, 48);

  return {
    moves,
    goals,
    collect,
  };
}

export function remainingOf(
  kind: GoalKind,
  obstacles: (ObstacleCell | null)[][],
  collectLeft: number,
): number {
  if (kind === "collect") return collectLeft;

  let total = 0;

  for (const row of obstacles) {
    for (const cell of row) {
      if (!cell) continue;

      if (kind === "ice" && cell.lock === "ice" && cell.lockLayers > 0) total++;
      else if (kind === "chain" && cell.lock === "chain" && cell.lockLayers > 0) total++;
      else if (kind === "crate" && cell.blocker === "crate" && cell.blockerLayers > 0) total++;
      else if (kind === "terrain" && cell.terrain > 0) total++;
      else if (kind === "rock" && cell.blocker === "rock") total++;
      else if (kind === "thorn" && cell.blocker === "thorn") total++;
    }
  }

  return total;
}
