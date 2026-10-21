import {fiendCoverKey, makeFiendCell} from "./fiend";
import {Cell, EMPTY, isRegular} from "./match3";

//* Stato di una cella aperta. Il buco è null e non passa da qui.
export type TerrainKind = "G" | "H";

export type ObstacleCell = {
  lock: "ice" | "chain" | null;
  lockLayers: number;
  /** Strati rimanenti sotto il pezzo (G=1, H=2 in griglia). */
  terrain: number;
  /** Tipo terreno iniziale: magma H passa allo sprite H_1 al primo colpo. */
  terrainKind: TerrainKind | null;
  blocker: "crate" | "rock" | "thorn" | "wall" | "fiend" | null;
  blockerLayers: number;
};

export type FallSegment = {slots: number[]; refill: boolean};

const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

export function obstacleFromSymbol(symbol: string): ObstacleCell {
  const cell: ObstacleCell = {
    lock: null,
    lockLayers: 0,
    terrain: 0,
    terrainKind: null,
    blocker: null,
    blockerLayers: 0,
  };

  if (symbol === "G") {
    cell.terrainKind = "G";
    cell.terrain = 1;
  } else if (symbol === "H") {
    cell.terrainKind = "H";
    cell.terrain = 2;
  }
  else if (symbol === "I") {
    cell.lock = "ice";
    cell.lockLayers = 1;
  } else if (symbol === "J") {
    cell.lock = "ice";
    cell.lockLayers = 2;
  } else if (symbol === "L") {
    cell.lock = "chain";
    cell.lockLayers = 1;
  } else if (symbol === "B") {
    cell.blocker = "crate";
    cell.blockerLayers = 1;
  } else if (symbol === "C") {
    cell.blocker = "crate";
    cell.blockerLayers = 2;
  } else if (symbol === "D") {
    cell.blocker = "crate";
    cell.blockerLayers = 3;
  } else if (symbol === "R") cell.blocker = "rock";
  else if (symbol === "V") cell.blocker = "thorn";
  else if (symbol === "X") cell.blocker = "wall";
  else if (symbol === "Z") return makeFiendCell();

  return cell;
}

export function holdsPiece(cell: ObstacleCell | null): boolean {
  return !!cell && cell.blocker === null;
}

//* Ghiaccio, catena, cassa, roccia, rovo e muro fermano la caduta. Il terreno no.
export function blocksColumn(cell: ObstacleCell | null): boolean {
  if (!cell) return false;

  return cell.blocker !== null || (cell.lock !== null && cell.lockLayers > 0);
}

export function coverKey(cell: ObstacleCell | null): string | null {
  if (!cell) return null;
  if (cell.blocker === "crate" && cell.blockerLayers >= 3) return "D";
  if (cell.blocker === "crate" && cell.blockerLayers === 2) return "C";
  if (cell.blocker === "crate") return "B";
  if (cell.blocker === "rock") return "R";
  if (cell.blocker === "thorn") return "V";
  if (cell.blocker === "wall") return "X";
  if (cell.blocker === "fiend") return fiendCoverKey(cell.blockerLayers);
  if (cell.lock === "ice" && cell.lockLayers >= 2) return "J";
  if (cell.lock === "ice") return "I";
  if (cell.lock === "chain") return "L";

  return null;
}

export function terrainKey(cell: ObstacleCell | null): string | null {
  if (!cell || cell.terrain <= 0) return null;
  if (cell.terrainKind === "H") return cell.terrain >= 2 ? "H" : "H_1";
  if (cell.terrainKind === "G") return "G";

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

type Hit = {
  iceHits: number;
  crateHits: number;
  chainBreak: boolean;
  rock: boolean;
  thorn: boolean;
  fiend: boolean;
  clearPiece: boolean;
  /** Colpi terreno G/H da blast (super oggetti, razzi, bombe). */
  terrainHits: number;
};

//* Un'ondata: il match dà al massimo 1 colpo adiacente. Ogni razzo o bomba aggiunge il suo.
export function applyWave(
  board: number[][],
  obstacles: (ObstacleCell | null)[][],
  matchCells: Cell[],
  blasts: Cell[][],
  spawnKeys: Set<string>,
): {
  pop: Cell[];
  thornDamaged: boolean;
  magmaCooled: Cell[];
  terrainGPurified: Cell[];
  iceBreak: Cell[];
  iceJCrack: Cell[];
  crateCrack: Cell[];
} {
  const rows = obstacles.length;
  const cols = obstacles[0]?.length ?? 0;
  const hits = new Map<string, Hit>();
  let thornDamaged = false;
  const magmaCooled: Cell[] = [];
  const terrainGPurified: Cell[] = [];
  const iceBreak: Cell[] = [];
  const iceJCrack: Cell[] = [];
  const crateCrack: Cell[] = [];

  const at = (cell: Cell): ObstacleCell | null => obstacles[cell.r]?.[cell.c] ?? null;

  const hit = (cell: Cell): Hit => {
    const key = keyOf(cell);
    const found = hits.get(key);

    if (found) return found;

    const created: Hit = {
      iceHits: 0,
      crateHits: 0,
      chainBreak: false,
      rock: false,
      thorn: false,
      fiend: false,
      clearPiece: false,
      terrainHits: 0,
    };

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
    if (obs.blocker === "crate") hit(cell).crateHits += 1;
    if (obs.blocker === "thorn") hit(cell).thorn = true;
    if (obs.blocker === "fiend") hit(cell).fiend = true;
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

    if (obs.terrain > 0) next.terrainHits += times;

    if (obs.lock === "ice") {
      next.iceHits += times;
      continue;
    }

    if (obs.lock === "chain") {
      next.chainBreak = true;
      continue;
    }

    if (obs.blocker === "crate") {
      next.crateHits += times;
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

    if (obs.blocker === "fiend") {
      next.fiend = true;
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
      const layersBefore = obs.lockLayers;

      obs.lockLayers = Math.max(0, obs.lockLayers - next.iceHits);

      if (obs.lockLayers === 0) {
        obs.lock = null;
        iceBreak.push(cell);
      } else if (layersBefore >= 2) {
        iceJCrack.push(cell);
      }
    }

    if (next.chainBreak && obs.lock === "chain") {
      obs.lock = null;
      obs.lockLayers = 0;
    }

    if (obs.blocker === "crate" && next.crateHits > 0) {
      const layersBefore = obs.blockerLayers;

      obs.blockerLayers = Math.max(0, obs.blockerLayers - next.crateHits);

      if (obs.blockerLayers === 0) {
        obs.blocker = null;
      } else if (layersBefore >= 2) {
        crateCrack.push(cell);
      }
    }

    if (next.rock && obs.blocker === "rock") obs.blocker = null;

    if (next.thorn && obs.blocker === "thorn") {
      obs.blocker = null;
      thornDamaged = true;
    }

    if (next.fiend && obs.blocker === "fiend") {
      obs.blocker = null;
      obs.blockerLayers = 0;
    }

    const stripTerrainLayer = (): void => {
      if (obs.terrain <= 0) return;

      if (obs.terrainKind === "H" && obs.terrain === 2) magmaCooled.push(cell);
      if (obs.terrainKind === "G" && obs.terrain === 1) terrainGPurified.push(cell);

      obs.terrain -= 1;
    };

    if (next.terrainHits > 0) {
      const layers = Math.min(next.terrainHits, obs.terrain);

      for (let i = 0; i < layers; i++) stripTerrainLayer();
    } else if (next.clearPiece && obs.terrain > 0) {
      stripTerrainLayer();
    }

    const locked = obs.lock !== null;
    const blocked = obs.blocker !== null;

    if (!next.clearPiece || next.chainBreak || locked || blocked || spawnKeys.has(key)) continue;
    if (board[cell.r][cell.c] === EMPTY) continue;

    pop.push(cell);
  }

  return {
    pop,
    thornDamaged,
    magmaCooled,
    terrainGPurified,
    iceBreak,
    iceJCrack,
    crateCrack,
  };
}

export type ThornSpread = {from: Cell; to: Cell};

export function canPlaceThornAt(
  obstacles: (ObstacleCell | null)[][],
  board: number[][],
  cell: Cell,
): boolean {
  const obs = obstacles[cell.r]?.[cell.c];

  if (!obs || obs.blocker || obs.lock || obs.terrain > 0) return false;

  return isRegular(board[cell.r][cell.c]);
}

function thornSpreadTargetsFrom(
  obstacles: (ObstacleCell | null)[][],
  board: number[][],
  from: Cell,
): Cell[] {
  const rows = obstacles.length;
  const cols = obstacles[0]?.length ?? 0;
  const targets: Cell[] = [];

  for (const [dr, dc] of DIRS) {
    const to = {r: from.r + dr, c: from.c + dc};

    if (to.r < 0 || to.c < 0 || to.r >= rows || to.c >= cols) continue;
    if (!canPlaceThornAt(obstacles, board, to)) continue;

    targets.push(to);
  }

  return targets;
}

/** Ogni rovo si sdoppia in una direzione adiacente valida (solo verso l'interno della griglia). */
export function listThornSpreads(
  obstacles: (ObstacleCell | null)[][],
  board: number[][],
  rand: () => number = Math.random,
): ThornSpread[] {
  const rows = obstacles.length;
  const cols = obstacles[0]?.length ?? 0;
  const spreads: ThornSpread[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (obstacles[r][c]?.blocker !== "thorn") continue;

      const from = {r, c};
      const targets = thornSpreadTargetsFrom(obstacles, board, from);

      if (!targets.length) continue;

      const to = targets[Math.floor(rand() * targets.length)];

      spreads.push({from, to});
    }
  }

  return spreads;
}

/** @deprecated Usa listThornSpreads — mantiene compat per test. */
export function pickThornSpread(
  obstacles: (ObstacleCell | null)[][],
  board: number[][],
): ThornSpread | null {
  const spreads = listThornSpreads(obstacles, board);

  if (!spreads.length) return null;

  return spreads[Math.floor(Math.random() * spreads.length)];
}
