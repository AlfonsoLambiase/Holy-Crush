//* Punti dei livelli sul centro della road, dal basso verso l'alto.

export type RoadPoint = {x: number; y: number};

const CELL = 4;
const CLOSE_RADIUS = 2;
const SMOOTH = 4;
type RoadLayout = {
  marks7: RoadPoint[];
  entry: RoadPoint;
  exit: RoadPoint;
};

const layoutCache = new Map<string, RoadLayout>();

const indexOf = (x: number, y: number, width: number) => y * width + x;

const dilate = (source: Uint8Array, width: number, height: number, radius: number) => {
  const out = new Uint8Array(source.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 0;

      for (let dy = -radius; dy <= radius && !on; dy += 1) {
        const yy = y + dy;

        if (yy < 0 || yy >= height) continue;

        for (let dx = -radius; dx <= radius; dx += 1) {
          const xx = x + dx;

          if (xx < 0 || xx >= width) continue;
          if (!source[indexOf(xx, yy, width)]) continue;

          on = 1;
          break;
        }
      }

      out[indexOf(x, y, width)] = on;
    }
  }

  return out;
};

const erode = (source: Uint8Array, width: number, height: number, radius: number) => {
  const out = new Uint8Array(source.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 1;

      for (let dy = -radius; dy <= radius && on; dy += 1) {
        const yy = y + dy;

        if (yy < 0 || yy >= height) {
          on = 0;
          break;
        }

        for (let dx = -radius; dx <= radius; dx += 1) {
          const xx = x + dx;

          if (xx >= 0 && xx < width && source[indexOf(xx, yy, width)]) continue;

          on = 0;
          break;
        }
      }

      out[indexOf(x, y, width)] = on;
    }
  }

  return out;
};

const neighborRing = (grid: Uint8Array, x: number, y: number, width: number, height: number) => {
  const at = (dx: number, dy: number) => {
    const xx = x + dx;
    const yy = y + dy;

    if (xx < 0 || yy < 0 || xx >= width || yy >= height) return 0;

    return grid[indexOf(xx, yy, width)];
  };

  return [at(0, -1), at(1, -1), at(1, 0), at(1, 1), at(0, 1), at(-1, 1), at(-1, 0), at(-1, -1)];
};

const transitions = (ring: number[]) => {
  let count = 0;

  for (let i = 0; i < ring.length; i += 1) {
    if (ring[i] === 0 && ring[(i + 1) % ring.length] === 1) count += 1;
  }

  return count;
};

//* Scheletro del nastro: resta solo la linea centrale
const thin = (grid: Uint8Array, width: number, height: number) => {
  let changed = true;

  for (let guard = 0; changed && guard < 80; guard += 1) {
    changed = false;

    for (const step of [0, 1]) {
      const kill: number[] = [];

      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const cell = indexOf(x, y, width);

          if (!grid[cell]) continue;

          const ring = neighborRing(grid, x, y, width, height);
          const filled = ring.reduce((sum, value) => sum + value, 0);

          if (filled < 2 || filled > 6 || transitions(ring) !== 1) continue;

          const corner =
            step === 0
              ? ring[0] * ring[2] * ring[4] || ring[2] * ring[4] * ring[6]
              : ring[0] * ring[2] * ring[6] || ring[0] * ring[4] * ring[6];

          if (corner) continue;

          kill.push(cell);
        }
      }

      if (!kill.length) continue;

      changed = true;
      for (const cell of kill) grid[cell] = 0;
    }
  }
};

const traceCenter = (grid: Uint8Array, width: number, height: number): Array<[number, number]> => {
  const cells: Array<[number, number]> = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (grid[indexOf(x, y, width)]) cells.push([x, y]);
    }
  }

  if (cells.length < 2) return [];

  const lookup = new Map(cells.map(([x, y], index) => [`${x},${y}`, index]));
  const neighbors = cells.map(([x, y]) => {
    const list: number[] = [];

    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;

        const next = lookup.get(`${x + dx},${y + dy}`);

        if (next !== undefined) list.push(next);
      }
    }

    return list;
  });

  let bottom = 0;
  let top = 0;

  for (let index = 1; index < cells.length; index += 1) {
    if (cells[index][1] > cells[bottom][1]) bottom = index;
    if (cells[index][1] < cells[top][1]) top = index;
  }

  const previous = new Int32Array(cells.length).fill(-1);
  const queue = [bottom];

  previous[bottom] = bottom;

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];

    if (current === top) break;

    for (const next of neighbors[current]) {
      if (previous[next] >= 0) continue;

      previous[next] = current;
      queue.push(next);
    }
  }

  if (previous[top] < 0) return [];

  const path: Array<[number, number]> = [];

  for (let current = top; current !== bottom; current = previous[current]) path.push(cells[current]);

  path.push(cells[bottom]);
  path.reverse();

  return path;
};

//* Sette tacche: ingresso in basso, cinque gomiti, uscita in alto. L'ultima road ne tiene sei.
export const LEVELS_PER_ROAD = 7;
export const ROAD_TILES = 3;
const BEND_COUNT = 5;
const END_INSET_CELLS = 18;

const smoothPath = (path: Array<[number, number]>): Array<[number, number]> =>
  path.map((_, index) => {
    let x = 0;
    let y = 0;
    let count = 0;

    for (let offset = -SMOOTH; offset <= SMOOTH; offset += 1) {
      const sample = path[Math.min(path.length - 1, Math.max(0, index + offset))];

      x += sample[0];
      y += sample[1];
      count += 1;
    }

    return [x / count, y / count];
  });

const pathDistance = (points: Array<[number, number]>) => {
  const distance = [0];

  for (let index = 1; index < points.length; index += 1) {
    distance.push(
      distance[index - 1] +
        Math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1]),
    );
  }

  return distance;
};

const pointAt = (
  points: Array<[number, number]>,
  distance: number[],
  target: number,
  imageWidth: number,
  imageHeight: number,
): RoadPoint => {
  let index = 1;

  while (index < distance.length - 1 && distance[index] < target) index += 1;

  const span = distance[index] - distance[index - 1] || 1;
  const t = Math.min(1, Math.max(0, (target - distance[index - 1]) / span));
  const x = points[index - 1][0] + (points[index][0] - points[index - 1][0]) * t;
  const y = points[index - 1][1] + (points[index][1] - points[index - 1][1]) * t;

  return {
    x: ((x + 0.5) * CELL) / imageWidth,
    y: ((y + 0.5) * CELL) / imageHeight,
  };
};

const bendIndexes = (points: Array<[number, number]>): number[] => {
  const span = 8;
  const runs: Array<{horizontal: boolean; from: number; to: number}> = [];

  for (let index = span; index < points.length - span; index += 1) {
    const dx = Math.abs(points[index][0] - points[index - span][0]);
    const dy = Math.abs(points[index][1] - points[index - span][1]);
    const horizontal = dx > dy * 1.25;
    const last = runs[runs.length - 1];

    if (!last || last.horizontal !== horizontal) runs.push({horizontal, from: index, to: index});
    else last.to = index;
  }

  const horizontals = runs.filter((run) => run.horizontal && run.to - run.from > 14);

  const ranked = (horizontals.length > BEND_COUNT ? [...horizontals].sort((a, b) => b.to - b.from - (a.to - a.from)).slice(0, BEND_COUNT) : horizontals).sort(
    (a, b) => a.from - b.from,
  );

  return ranked.map((run) => {
    const goingRight = points[run.to][0] >= points[run.from][0];
    let best = run.from;

    for (let index = run.from; index <= run.to; index += 1) {
      const x = points[index][0];

      if (goingRight ? x >= points[best][0] : x <= points[best][0]) best = index;
    }

    return best;
  });
};

const marksOnPath = (
  points: Array<[number, number]>,
  imageWidth: number,
  imageHeight: number,
): RoadPoint[] => {
  const distance = pathDistance(points);
  const total = distance[distance.length - 1] || 1;
  const inset = Math.min(END_INSET_CELLS, total * 0.08);
  const bends = bendIndexes(points).filter((index) => {
    const along = distance[index] ?? 0;

    return along > inset && along < total - inset;
  });
  const targets =
    bends.length === BEND_COUNT
      ? [inset, ...bends.map((index) => distance[index]), total - inset]
      : Array.from({length: LEVELS_PER_ROAD}, (_, index) => inset + (index / (LEVELS_PER_ROAD - 1)) * (total - inset * 2));

  return targets.map((target) => pointAt(points, distance, target, imageWidth, imageHeight));
};

const traceLayout = (
  alpha: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): RoadLayout | null => {
  if (width < 2 || height < 2) return null;

  const gridWidth = Math.ceil(width / CELL);
  const gridHeight = Math.ceil(height / CELL);
  const counts = new Uint16Array(gridWidth * gridHeight);
  const need = CELL * CELL * 0.22;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alpha[y * width + x] <= 28) continue;

      counts[indexOf(Math.floor(x / CELL), Math.floor(y / CELL), gridWidth)] += 1;
    }
  }

  let grid = new Uint8Array(gridWidth * gridHeight);

  for (let cell = 0; cell < grid.length; cell += 1) grid[cell] = counts[cell] >= need ? 1 : 0;

  grid = erode(dilate(grid, gridWidth, gridHeight, CLOSE_RADIUS), gridWidth, gridHeight, CLOSE_RADIUS);
  thin(grid, gridWidth, gridHeight);

  const path = traceCenter(grid, gridWidth, gridHeight);

  if (path.length < 2) return null;

  const smoothed = smoothPath(path);
  const distance = pathDistance(smoothed);
  const total = distance[distance.length - 1] || 1;

  return {
    marks7: marksOnPath(smoothed, width, height),
    entry: pointAt(smoothed, distance, 0, width, height),
    exit: pointAt(smoothed, distance, total, width, height),
  };
};

const gapVariance = (points: RoadPoint[]): number => {
  const gaps: number[] = [];

  for (let index = 1; index < points.length; index += 1) {
    gaps.push(Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y));
  }

  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / Math.max(1, gaps.length);

  return gaps.reduce((sum, gap) => sum + (gap - mean) ** 2, 0);
};

//* Toglie le tacche di mezzo finché ne restano `count`, tenendo ingresso e uscita.
export const trimRoadMarks = (marks: RoadPoint[], count: number): RoadPoint[] => {
  if (count >= marks.length) return marks.slice(0, count);
  if (count <= 0) return [];

  const current = marks.slice();

  while (current.length > count) {
    let drop = 1;
    let bestScore = Number.POSITIVE_INFINITY;
    const middle = (current.length - 1) / 2;

    for (let index = 1; index < current.length - 1; index += 1) {
      const next = current.filter((_, item) => item !== index);
      const score = gapVariance(next);

      if (score < bestScore || (score === bestScore && Math.abs(index - middle) < Math.abs(drop - middle))) {
        bestScore = score;
        drop = index;
      }
    }

    current.splice(drop, 1);
  }

  return current;
};

export const fallbackRoadPoints = (levels: number): RoadPoint[] =>
  Array.from({length: levels}, (_, index) => ({
    x: 0.5,
    y: 0.94 - (index / Math.max(1, levels - 1)) * 0.88,
  }));

const fallbackRoadLayout = (): RoadLayout => {
  const marks7 = fallbackRoadPoints(LEVELS_PER_ROAD);

  return {
    marks7,
    entry: {x: 0.5, y: 1},
    exit: {x: 0.5, y: 0},
  };
};

export const roadLayoutFromAlpha = (
  alpha: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): RoadLayout => {
  const layout = traceLayout(alpha, width, height);

  if (layout?.marks7.length === LEVELS_PER_ROAD) return layout;

  return fallbackRoadLayout();
};

export const roadMarksOnImage = (
  source: CanvasImageSource & {width: number; height: number; src?: string},
  cacheKey: string,
): RoadPoint[] => roadLayoutOnImage(source, cacheKey).marks7;

export const roadLayoutOnImage = (
  source: CanvasImageSource & {width: number; height: number; src?: string},
  cacheKey: string,
): RoadLayout => {
  const cached = layoutCache.get(cacheKey);

  if (cached) return cached;

  const canvas = document.createElement("canvas");

  canvas.width = source.width;
  canvas.height = source.height;

  const context = canvas.getContext("2d", {willReadFrequently: true});

  if (!context || source.width < 2 || source.height < 2) return fallbackRoadLayout();

  context.drawImage(source, 0, 0);

  const alpha = context.getImageData(0, 0, source.width, source.height).data;
  const channel = new Uint8Array(source.width * source.height);

  for (let pixel = 0; pixel < channel.length; pixel += 1) channel[pixel] = alpha[pixel * 4 + 3];

  const layout = roadLayoutFromAlpha(channel, source.width, source.height);

  layoutCache.set(cacheKey, layout);

  return layout;
};

//* Tre road impilate: dal basso (livelli 1–7) verso l'alto (15–20 con 6 tacche).
export const buildStackedLevelPoints = (
  marks7: RoadPoint[],
  totalLevels: number,
  entry: RoadPoint,
  exit: RoadPoint,
): RoadPoint[] => {
  const points: RoadPoint[] = [];

  for (let stack = ROAD_TILES - 1; stack >= 0; stack -= 1) {
    const count = stack === 0 ? totalLevels - 2 * LEVELS_PER_ROAD : LEVELS_PER_ROAD;
    const tileMarks = count === LEVELS_PER_ROAD ? marks7 : trimRoadMarks(marks7, count);

    for (const mark of tileMarks) {
      points.push({
        x: mark.x,
        y: (stack + mark.y) / ROAD_TILES,
      });
    }
  }

  if (points.length === totalLevels) {
    points[0] = {
      x: entry.x,
      y: 1,
    };
    points[totalLevels - 1] = {
      x: exit.x,
      y: 0,
    };
  }

  return points;
};

export const stackedLevelPointsFromImage = (
  source: CanvasImageSource & {width: number; height: number; src?: string},
  totalLevels: number,
  cacheKey: string,
): RoadPoint[] => {
  const {marks7, entry, exit} = roadLayoutOnImage(source, cacheKey);

  return buildStackedLevelPoints(marks7, totalLevels, entry, exit);
};

export const stackedLevelPointsFallback = (totalLevels: number): RoadPoint[] => {
  const layout = fallbackRoadLayout();

  return buildStackedLevelPoints(layout.marks7, totalLevels, layout.entry, layout.exit);
};
