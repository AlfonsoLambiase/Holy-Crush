export const GRID_SYMBOLS = [".", "0", "G", "H", "I", "J", "L", "R", "V", "X"] as const;

export type GridSymbol = (typeof GRID_SYMBOLS)[number];

export type GridShape = {
  id: string;
  rows: number;
  cols: number;
  cells: GridSymbol[][];
};

const ALLOWED = new Set<string>(GRID_SYMBOLS);

//* . buco, 0 pezzo, G/H terreno, I/J ghiaccio, L catena, R roccia, V rovo, X muro.
export function createGrid(id: string, pattern: readonly string[]): GridShape {
  if (pattern.length === 0) {
    throw new Error(`Griglia "${id}" vuota.`);
  }

  const cols = pattern[0].length;
  const cells = pattern.map((row, index) => {
    if (row.length !== cols) {
      throw new Error(`Griglia "${id}": la riga ${index + 1} non è lunga ${cols}.`);
    }

    return [...row].map((cell) => {
      if (!ALLOWED.has(cell)) {
        throw new Error(
          `Griglia "${id}": carattere "${cell}" non valido. Usa ${GRID_SYMBOLS.join(" ")}.`,
        );
      }

      return cell as GridSymbol;
    });
  });

  return {id, rows: pattern.length, cols, cells};
}
