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

const OBSTACLE: Record<Exclude<GoalKind, "collect">, readonly string[]> = {
  ice: ["I", "J"],
  chain: ["L"],
  crate: ["B", "C", "D"],
  terrain: ["G", "H"],
  rock: ["R"],
  thorn: ["V"],
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const has = (cells: GridSymbol[][], symbol: string): boolean =>
  cells.some((row) => row.includes(symbol as GridSymbol));

const countSymbol = (cells: GridSymbol[][], symbols: readonly string[]): number =>
  cells.reduce(
    (total, row) => total + row.filter((cell) => symbols.includes(cell)).length,
    0,
  );

//* Icona dell'ostacolo più duro presente, così il giocatore riconosce il disegno.
const iconFor = (kind: Exclude<GoalKind, "collect">, cells: GridSymbol[][]): string => {
  const symbols = OBSTACLE[kind];

  for (let index = symbols.length - 1; index >= 0; index--) {
    if (has(cells, symbols[index])) return symbols[index];
  }

  return symbols[0];
};

//* 1 obiettivo se il tabellone è semplice, 2 quando gli ostacoli sono tanti.
export function missionForGrid(cells: GridSymbol[][], pieceIcon: string): LevelMission {
  const ranked = (Object.keys(OBSTACLE) as Exclude<GoalKind, "collect">[])
    .map((kind) => ({kind, total: countSymbol(cells, OBSTACLE[kind])}))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);

  const obstacles = ranked.reduce((total, entry) => total + entry.total, 0);
  const rows = cells.length;

  if (ranked.length === 0) {
    const open = countSymbol(cells, ["0"]);

    return {
      moves: clamp(18 + rows, 20, 28),
      goals: [{kind: "collect", icon: pieceIcon}],
      collect: clamp(Math.round(open * 0.45), 8, 16),
    };
  }

  const take = obstacles >= 10 && ranked.length >= 2 ? 2 : 1;

  return {
    moves: clamp(16 + rows + obstacles * 2, 18, 42),
    goals: ranked.slice(0, take).map((entry) => ({
      kind: entry.kind,
      icon: iconFor(entry.kind, cells),
    })),
    collect: 0,
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
