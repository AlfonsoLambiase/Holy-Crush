//* Contorno della griglia giocabile. Gli angoli, anche quelli interni, sono archi e non spigoli a 90°.

export type BoardPoint = {x: number; y: number};

export type BoardFillet = {
  start: BoardPoint;
  end: BoardPoint;
  center: BoardPoint;
  radius: number;
  anticlockwise: boolean;
};

export const BOARD_CORNER_RATIO = 0.22;

type Edge = {a: BoardPoint; b: BoardPoint};

const pointKey = (point: BoardPoint): string => `${point.x},${point.y}`;

const edgeKey = (from: BoardPoint, to: BoardPoint): string => `${pointKey(from)}>${pointKey(to)}`;

const toggleEdge = (edges: Map<string, Edge>, from: BoardPoint, to: BoardPoint): void => {
  const forward = edgeKey(from, to);
  const back = edgeKey(to, from);

  if (edges.has(back)) {
    edges.delete(back);

    return;
  }

  edges.set(forward, {a: from, b: to});
};

const boundaryEdges = (open: readonly (readonly boolean[])[]): Map<string, Edge> => {
  const edges = new Map<string, Edge>();

  for (let row = 0; row < open.length; row++) {
    const line = open[row];

    for (let col = 0; col < line.length; col++) {
      if (!line[col]) continue;

      toggleEdge(edges, {x: col + 1, y: row}, {x: col, y: row});
      toggleEdge(edges, {x: col, y: row}, {x: col, y: row + 1});
      toggleEdge(edges, {x: col, y: row + 1}, {x: col + 1, y: row + 1});
      toggleEdge(edges, {x: col + 1, y: row + 1}, {x: col + 1, y: row});
    }
  }

  return edges;
};

const turnOf = (incoming: BoardPoint, outgoing: BoardPoint): number => {
  const cross = incoming.x * outgoing.y - incoming.y * outgoing.x;
  const dot = incoming.x * outgoing.x + incoming.y * outgoing.y;

  return Math.atan2(cross, dot);
};

const traceLoop = (
  start: Edge,
  outgoing: Map<string, BoardPoint[]>,
  used: Set<string>,
  maxSteps: number,
): BoardPoint[] | null => {
  const loop: BoardPoint[] = [];
  let from = start.a;
  let to = start.b;

  for (let step = 0; step < maxSteps; step++) {
    const key = edgeKey(from, to);

    if (used.has(key) && loop.length > 0) break;

    used.add(key);
    loop.push(from);

    const options = outgoing.get(pointKey(to)) ?? [];
    const incoming = {x: to.x - from.x, y: to.y - from.y};
    let next: BoardPoint | null = null;
    let bestTurn = Infinity;

    for (const candidate of options) {
      if (used.has(edgeKey(to, candidate))) continue;

      const turn = turnOf(incoming, {x: candidate.x - to.x, y: candidate.y - to.y});

      if (turn < bestTurn) {
        bestTurn = turn;
        next = candidate;
      }
    }

    if (!next) break;

    from = to;
    to = next;
  }

  if (loop.length < 4 || !used.has(edgeKey(loop[loop.length - 1], loop[0]))) return null;

  return loop;
};

const simplify = (loop: readonly BoardPoint[]): BoardPoint[] => {
  const corners: BoardPoint[] = [];
  const count = loop.length;

  for (let index = 0; index < count; index++) {
    const prev = loop[(index - 1 + count) % count];
    const current = loop[index];
    const next = loop[(index + 1) % count];
    const inX = current.x - prev.x;
    const inY = current.y - prev.y;
    const outX = next.x - current.x;
    const outY = next.y - current.y;

    if (inX * outY - inY * outX !== 0) corners.push(current);
  }

  return corners;
};

const traceCorners = (open: readonly (readonly boolean[])[]): BoardPoint[][] => {
  const edges = boundaryEdges(open);
  const outgoing = new Map<string, BoardPoint[]>();

  for (const edge of edges.values()) {
    const key = pointKey(edge.a);
    const list = outgoing.get(key);

    if (list) list.push(edge.b);
    else outgoing.set(key, [edge.b]);
  }

  const used = new Set<string>();
  const loops: BoardPoint[][] = [];

  for (const edge of edges.values()) {
    if (used.has(edgeKey(edge.a, edge.b))) continue;

    const loop = traceLoop(edge, outgoing, used, edges.size + 1);

    if (!loop) continue;

    const corners = simplify(loop);

    if (corners.length >= 4) loops.push(corners);
  }

  return loops;
};

const filletLoop = (corners: readonly BoardPoint[], cornerRatio: number, cell: number): BoardFillet[] => {
  const count = corners.length;
  const wanted = cell * cornerRatio;
  const fillets: BoardFillet[] = [];

  for (let index = 0; index < count; index++) {
    const prev = corners[(index - 1 + count) % count];
    const current = corners[index];
    const next = corners[(index + 1) % count];
    const inX = current.x - prev.x;
    const inY = current.y - prev.y;
    const outX = next.x - current.x;
    const outY = next.y - current.y;
    const inLen = Math.hypot(inX, inY);
    const outLen = Math.hypot(outX, outY);

    if (inLen === 0 || outLen === 0) continue;

    const inXUnit = inX / inLen;
    const inYUnit = inY / inLen;
    const outXUnit = outX / outLen;
    const outYUnit = outY / outLen;
    const radius = Math.min(wanted, inLen / 2, outLen / 2);
    const start = {x: current.x - inXUnit * radius, y: current.y - inYUnit * radius};
    const cross = inXUnit * outYUnit - inYUnit * outXUnit;
    const leftX = inYUnit;
    const leftY = -inXUnit;
    const side = cross < 0 ? 1 : -1;

    fillets.push({
      start,
      end: {x: current.x + outXUnit * radius, y: current.y + outYUnit * radius},
      center: {x: start.x + leftX * radius * side, y: start.y + leftY * radius * side},
      radius,
      anticlockwise: cross < 0,
    });
  }

  return fillets;
};

//* open[riga][colonna]. L'origine è l'angolo in alto a sinistra della cella 0,0.
export function boardContours(
  open: readonly (readonly boolean[])[],
  cell: number,
  originX = 0,
  originY = 0,
  cornerRatio = BOARD_CORNER_RATIO,
): BoardFillet[][] {
  if (cell <= 0) return [];

  return traceCorners(open)
    .map((corners) =>
      corners.map((corner) => ({
        x: originX + corner.x * cell,
        y: originY + corner.y * cell,
      })),
    )
    .map((corners) => filletLoop(corners, cornerRatio, cell))
    .filter((fillets) => fillets.length >= 4);
}
