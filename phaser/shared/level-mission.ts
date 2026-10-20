import type {GridSymbol} from "../grid/create-grid";
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

const buildGoals = (
  cells: GridSymbol[][],
  pieceIcon: string,
  progression: MissionProgression,
): MissionGoal[] => {
  const goalCount = goalCountForStage(progression.stageIndex);
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

  return {
    moves,
    goals,
    collect: hasCollect ? scaleCollectTarget(open, progression, goals.length) : 0,
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
