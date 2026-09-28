export type GridShape = {
  id: string;
  rows: number;
  cols: number;
  mask: boolean[][];
};

//* Legge il disegno: "0" è una cella, "." è un buco. Le righe hanno la stessa larghezza.
export function createGrid(id: string, pattern: readonly string[]): GridShape {
  if (pattern.length === 0) {
    throw new Error(`Griglia "${id}" vuota.`);
  }

  const cols = pattern[0].length;
  const mask = pattern.map((row, index) => {
    if (row.length !== cols) {
      throw new Error(`Griglia "${id}": la riga ${index + 1} non è lunga ${cols}.`);
    }

    return [...row].map((cell) => {
      if (cell === "0") return true;
      if (cell === ".") return false;

      throw new Error(`Griglia "${id}": carattere "${cell}" non valido. Usa 0 o .`);
    });
  });

  return {id, rows: pattern.length, cols, mask};
}
