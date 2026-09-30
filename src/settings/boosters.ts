export type BoosterId = "super" | "mega";

export const BOOSTER_MAX = 5;
const STORAGE_KEY = "holy-crush-boosters";

type Stock = Record<BoosterId, number>;

const emptyStock = (): Stock => ({super: 0, mega: 0});

const clampCount = (value: number) => Math.min(BOOSTER_MAX, Math.max(0, Math.floor(value)));

const readStock = (): Stock => {
  if (typeof window === "undefined") return emptyStock();

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return emptyStock();

  try {
    const parsed = JSON.parse(raw) as Partial<Stock>;

    return {
      super: clampCount(Number(parsed.super) || 0),
      mega: clampCount(Number(parsed.mega) || 0),
    };
  } catch {
    return emptyStock();
  }
};

const writeStock = (stock: Stock) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stock));
};

export const getBoosterCount = (id: BoosterId): number => readStock()[id];

export const isBoosterFull = (id: BoosterId): boolean => getBoosterCount(id) >= BOOSTER_MAX;

export const addBooster = (id: BoosterId): boolean => {
  const stock = readStock();

  if (stock[id] >= BOOSTER_MAX) return false;

  stock[id] += 1;
  writeStock(stock);

  return true;
};

//* Per ora si consuma solo al drop in griglia. I ruoli in board arrivano dopo.
export const spendBooster = (id: BoosterId): boolean => {
  const stock = readStock();

  if (stock[id] <= 0) return false;

  stock[id] -= 1;
  writeStock(stock);

  return true;
};
