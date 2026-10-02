import {Cell, EMPTY, isRegular} from "./match3";

//* Stato di una cella aperta. Il buco è null e non passa da qui.
export type ObstacleCell = {
  lock: "ice" | "chain" | null;
  lockLayers: number;
  terrain: number;
  blocker: "rock" | "thorn" | "wall" | null;
};

export type FallSegment = {slots: number[]; refill: boolean};

const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

export function obstacleFromSymbol(symbol: string): ObstacleCell {
  const cell: ObstacleCell = {lock: null, lockLayers: 0, terrain: 0, blocker: null};

  if (symbol === "G") cell.terrain = 1;
  else if (symbol === "H") cell.terrain = 2;
  else if (symbol === "I") {
    cell.lock = "ice";
    cell.lockLayers = 1;
  } else if (symbol === "J") {
    cell.lock = "ice";
    cell.lockLayers = 2;
  } else if (symbol === "L") {
    cell.lock = "chain";
    cell.lockLayers = 1;
  } else if (symbol === "R") cell.blocker = "rock";
  else if (symbol === "V") cell.blocker = "thorn";
  else if (symbol === "X") cell.blocker = "wall";

  return cell;
}

export function holdsPiece(cell: ObstacleCell | null): boolean {
  return !!cell && cell.blocker === null;
}

//* Ghiaccio, catena, roccia, rovo e muro fermano la caduta. Il terreno no.
export function blocksColumn(cell: ObstacleCell | null): boolean {
  if (!cell) return false;

  return cell.blocker !== null || (cell.lock !== null && cell.lockLayers > 0);
}

export function coverKey(cell: ObstacleCell | null): string | null {
  if (!cell) return null;
  if (cell.blocker === "rock") return "R";
  if (cell.blocker === "thorn") return "V";
  if (cell.blocker === "wall") return "X";
  if (cell.lock === "ice" && cell.lockLayers >= 2) return "J";
  if (cell.lock === "ice") return "I";
  if (cell.lock === "chain") return "L";

  return null;
}

export function terrainKey(cell: ObstacleCell | null): string | null {
  if (!cell) return null;
  if (cell.terrain >= 2) return "H";
  if (cell.terrain === 1) return "G";

  return null;
}

function keyOf(cell: Cell): string {
  return `${cell.r},${cell.c}`;
}

function parseKey(key: string): Cell {
  const [r, c] = key.split(",").map(Number);

  return {r, c};
}

//* I buchi non spezzano la colonna. Gli ostacoli solidi sì. Si rifornisce solo il tratto in cima.
export function columnSegments(
  rowCount: number,
  kindAt: (row: number) => "hole" | "block" | "mobile",
): FallSegment[] {
  const segments: FallSegment[] = [];
  let slots: number[] = [];

  const push = () => {
    if (!slots.length) return;

    segments.push({slots, refill: false});
    slots = [];
  };

  for (let row = rowCount - 1; row >= 0; row--) {
    const kind = kindAt(row);

    if (kind === "hole") continue;

    if (kind === "block") {
      push();
      continue;
    }

    slots.push(row);
  }

  push();

  const top = segments[segments.length - 1];

  if (!top) return segments;

  const topRow = Math.min(...top.slots);
  let blocked = false;

  for (let row = 0; row < topRow; row++) {
    if (kindAt(row) === "block") blocked = true;
  }

  top.refill = !blocked;

  return segments;
}

function adjacentOnce(matchCells: Cell[], rows: number, cols: number): Cell[] {
  const source = new Set(matchCells.map(keyOf));
  const hit = new Set<string>();

  for (const cell of matchCells) {
    for (const [dr, dc] of DIRS) {
      const next = {r: cell.r + dr, c: cell.c + dc};
      const key = keyOf(next);

      if (next.r < 0 || next.c < 0 || next.r >= rows || next.c >= cols) continue;
      if (source.has(key) || hit.has(key)) continue;

      hit.add(key);
    }
  }

  return [...hit].map(parseKey);
}

type Hit = {iceHits: number; chainBreak: boolean; rock: boolean; thorn: boolean; clearPiece: boolean};

//* Un'ondata: il match dà al massimo 1 colpo adiacente. Ogni razzo o bomba aggiunge il suo.
export function applyWave(
  board: number[][],
  obstacles: (ObstacleCell | null)[][],
  matchCells: Cell[],
  blasts: Cell[][],
  spawnKeys: Set<string>,
): {pop: Cell[]; thornDamaged: boolean} {
  const rows = obstacles.length;
  const cols = obstacles[0]?.length ?? 0;
  const hits = new Map<string, Hit>();
  let thornDamaged = false;

  const at = (cell: Cell): ObstacleCell | null => obstacles[cell.r]?.[cell.c] ?? null;

  const hit = (cell: Cell): Hit => {
    const key = keyOf(cell);
    const found = hits.get(key);

    if (found) return found;

    const created: Hit = {iceHits: 0, chainBreak: false, rock: false, thorn: false, clearPiece: false};

    hits.set(key, created);

    return created;
  };

  for (const cell of matchCells) {
    const obs = at(cell);

    if (!obs || obs.blocker || obs.lock === "ice") continue;

    const next = hit(cell);

    if (obs.lock === "chain") {
      next.chainBreak = true;
      continue;
    }

    next.clearPiece = true;
  }

  for (const cell of adjacentOnce(matchCells, rows, cols)) {
    const obs = at(cell);

    if (!obs || obs.blocker === "wall") continue;

    if (obs.lock === "ice") hit(cell).iceHits += 1;
    if (obs.blocker === "thorn") hit(cell).thorn = true;
  }

  const blastCounts = new Map<string, number>();

  for (const blast of blasts) {
    const seen = new Set<string>();

    for (const cell of blast) {
      const key = keyOf(cell);

      if (seen.has(key)) continue;

      seen.add(key);
      blastCounts.set(key, (blastCounts.get(key) ?? 0) + 1);
    }
  }

  for (const [key, times] of blastCounts) {
    const cell = parseKey(key);
    const obs = at(cell);

    if (!obs || obs.blocker === "wall") continue;

    const next = hit(cell);

    if (obs.lock === "ice") {
      next.iceHits += times;
      continue;
    }

    if (obs.lock === "chain") {
      next.chainBreak = true;
      continue;
    }

    if (obs.blocker === "rock") {
      next.rock = true;
      continue;
    }

    if (obs.blocker === "thorn") {
      next.thorn = true;
      continue;
    }

    if (board[cell.r][cell.c] !== EMPTY) next.clearPiece = true;
  }

  const pop: Cell[] = [];

  for (const [key, next] of hits) {
    const cell = parseKey(key);
    const obs = at(cell);

    if (!obs) continue;

    if (obs.lock === "ice" && next.iceHits > 0) {
      obs.lockLayers = Math.max(0, obs.lockLayers - next.iceHits);
      if (obs.lockLayers === 0) obs.lock = null;
    }

    if (next.chainBreak && obs.lock === "chain") {
      obs.lock = null;
      obs.lockLayers = 0;
    }

    if (next.rock && obs.blocker === "rock") obs.blocker = null;

    if (next.thorn && obs.blocker === "thorn") {
      obs.blocker = null;
      thornDamaged = true;
    }

    if (next.clearPiece && obs.terrain > 0) obs.terrain -= 1;

    const locked = obs.lock !== null;
    const blocked = obs.blocker !== null;

    if (!next.clearPiece || next.chainBreak || locked || blocked || spawnKeys.has(key)) continue;
    if (board[cell.r][cell.c] === EMPTY) continue;

    pop.push(cell);
  }

  return {pop, thornDamaged};
}

//* Dopo le cascate, se nessun rovo è stato colpito, ne nasce uno su un pezzo normale vicino.
export function pickThornTarget(
  obstacles: (ObstacleCell | null)[][],
  board: number[][],
): Cell | null {
  const rows = obstacles.length;
  const cols = obstacles[0]?.length ?? 0;
  const targets: Cell[] = [];
  const seen = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (obstacles[r][c]?.blocker !== "thorn") continue;

      for (const [dr, dc] of DIRS) {
        const cell = {r: r + dr, c: c + dc};
        const key = keyOf(cell);

        if (seen.has(key)) continue;
        if (cell.r < 0 || cell.c < 0 || cell.r >= rows || cell.c >= cols) continue;

        const obs = obstacles[cell.r][cell.c];

        if (!obs || obs.blocker || obs.lock || obs.terrain > 0) continue;
        if (!isRegular(board[cell.r][cell.c])) continue;

        seen.add(key);
        targets.push(cell);
      }
    }
  }

  if (!targets.length) return null;

  return targets[Math.floor(Math.random() * targets.length)];
}
