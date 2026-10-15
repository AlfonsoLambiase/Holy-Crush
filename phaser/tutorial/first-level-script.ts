import {
  BOMB,
  type Cell,
  findMatchRuns,
  hasMatches,
  isRegular,
  ROCKET_H,
  ROCKET_V,
  specialsFromRuns,
  swapCells,
} from "../shared/match3";
import type {PageOptions} from "./tutorial";

export type GuidedMove = {from: Cell; to: Cell};

export type ComboSetup = GuidedMove & {cells: {cell: Cell; type: number}[]};

//* Forma della combinazione rispetto alla cella di arrivo (0,0): pezzi uguali già in griglia e pezzo da strisciare.
type ComboShape = {same: Cell[]; mover: Cell};

//* Quattro in riga: manca il terzo, arriva da sotto.
const ROCKET_H_SHAPE: ComboShape = {
  same: [
    {r: 0, c: -2},
    {r: 0, c: -1},
    {r: 0, c: 1},
  ],
  mover: {r: 1, c: 0},
};

//* Quattro in colonna: manca il terzo, arriva da destra.
const ROCKET_V_SHAPE: ComboShape = {
  same: [
    {r: -2, c: 0},
    {r: -1, c: 0},
    {r: 1, c: 0},
  ],
  mover: {r: 0, c: 1},
};

//* L da 5: manca l'angolo, arriva da sopra.
const BOMB_SHAPE: ComboShape = {
  same: [
    {r: 0, c: -2},
    {r: 0, c: -1},
    {r: 1, c: 0},
    {r: 2, c: 0},
  ],
  mover: {r: -1, c: 0},
};

const SHAPES: Record<number, ComboShape> = {
  [ROCKET_H]: ROCKET_H_SHAPE,
  [ROCKET_V]: ROCKET_V_SHAPE,
  [BOMB]: BOMB_SHAPE,
};

const pickRocket = (): number => (Math.random() < 0.5 ? ROCKET_H : ROCKET_V);

//* Quello che il game manager mette a disposizione dello script.
export type FirstLevelHost = {
  page: (index: number, options?: PageOptions) => Promise<void>;
  //* Prepara in griglia la combinazione che crea il power-up e dice quale pezzo strisciare.
  rig: (type: number) => GuidedMove | null;
  //* Si risolve quando la mossa guidata e le cascate sono finite.
  guide: (from: Cell, to?: Cell) => Promise<void>;
  ensureSpecial: (type: number) => Cell | null;
  showcaseItems: (on: boolean) => void;
  yourTurn: () => Promise<void>;
};

//* Swipe, Ira Celeste, Cuore Sacro, super oggetti, poi "TOCCA A TE!".
export const runFirstLevelScript = async (host: FirstLevelHost): Promise<void> => {
  const rocketType = pickRocket();
  const rocketMove = host.rig(rocketType);

  await host.page(0);

  if (rocketMove) await host.guide(rocketMove.from, rocketMove.to);

  const rocket = host.ensureSpecial(rocketType);

  await host.page(1);

  if (rocket) await host.guide(rocket);

  const bombMove = host.rig(BOMB);

  if (bombMove) await host.guide(bombMove.from, bombMove.to);

  const bomb = host.ensureSpecial(BOMB);

  await host.page(2);

  if (bomb) await host.guide(bomb);

  host.showcaseItems(true);
  await host.page(3, {rise: true, keepDark: true});
  host.showcaseItems(false);
  await host.yourTurn();
};

export const isSameFamily = (a: number, b: number): boolean =>
  a === b || ((a === ROCKET_H || a === ROCKET_V) && (b === ROCKET_H || b === ROCKET_V));

const byCenter = (rows: number, cols: number) => (a: Cell, b: Cell) =>
  Math.hypot(a.r - rows / 2, a.c - cols / 2) - Math.hypot(b.r - rows / 2, b.c - cols / 2);

//* Prima le celle più vicine al centro della griglia.
export const centerFirst = (cells: Cell[], rows: number, cols: number): Cell[] =>
  [...cells].sort(byCenter(rows, cols));

//* Le 4 rotazioni e i loro specchi.
const TRANSFORMS: ((cell: Cell) => Cell)[] = [
  ({r, c}) => ({r, c}),
  ({r, c}) => ({r: c, c: -r}),
  ({r, c}) => ({r: -r, c: -c}),
  ({r, c}) => ({r: -c, c: r}),
  ({r, c}) => ({r, c: -c}),
  ({r, c}) => ({r: c, c: r}),
  ({r, c}) => ({r: -r, c}),
  ({r, c}) => ({r: -c, c: -r}),
];

//* Cerca, partendo dal centro, dove disegnare la forma senza match già pronti e con lo swipe che crea il power-up.
export const findComboSetup = (
  board: number[][],
  typeCount: number,
  special: number,
  isFree: (r: number, c: number) => boolean,
  canMatch: (r: number, c: number) => boolean,
): ComboSetup | null => {
  const shape = SHAPES[special];
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  if (!shape) return null;

  const usable = (cell: Cell) =>
    cell.r >= 0 &&
    cell.c >= 0 &&
    cell.r < rows &&
    cell.c < cols &&
    isFree(cell.r, cell.c) &&
    isRegular(board[cell.r][cell.c]);
  const targets: Cell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) targets.push({r, c});
  }

  for (const to of centerFirst(targets, rows, cols)) {
    for (const transform of TRANSFORMS) {
      const at = (offset: Cell) => {
        const turned = transform(offset);

        return {r: to.r + turned.r, c: to.c + turned.c};
      };
      const same = shape.same.map(at);
      const from = at(shape.mover);

      if (![to, from, ...same].every(usable)) continue;

      for (let a = 0; a < typeCount; a++) {
        for (let b = 0; b < typeCount; b++) {
          if (a === b) continue;

          const cells = [
            ...same.map((cell) => ({cell, type: a})),
            {cell: from, type: a},
            {cell: to, type: b},
          ];
          const copy = board.map((row) => [...row]);

          for (const {cell, type} of cells) copy[cell.r][cell.c] = type;

          if (hasMatches(copy, canMatch)) continue;

          swapCells(copy, from, to);

          const spawns = specialsFromRuns(findMatchRuns(copy, canMatch), to);

          if (spawns.some((spawn) => spawn.type === special)) return {from, to, cells};
        }
      }
    }
  }

  return null;
};
