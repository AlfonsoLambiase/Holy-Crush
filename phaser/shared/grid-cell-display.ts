import type {GridSymbol} from "../grid/create-grid";
import {coverKey, terrainKey, obstacleFromSymbol} from "./obstacles";

/** Chiave asset per anteprima simbolo in browser griglie. */
export function displayKeyForSymbol(symbol: GridSymbol): string | null {
  if (symbol === "." || symbol === "0") return null;
  if (symbol === "Z") return "Z_0";

  const cell = obstacleFromSymbol(symbol);

  return coverKey(cell) ?? terrainKey(cell);
}
