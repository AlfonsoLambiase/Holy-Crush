import type {BoosterId} from "@/settings/boosters";
import {notifyLocalSave} from "./local-save-signal";

export type ShopAdId = "energy" | "moves" | BoosterId;

export const SHOP_AD_COST: Record<ShopAdId, number> = {
  energy: 1,
  moves: 1,
  super: 1,
  mega: 1,
  ultra: 2,
  maxi: 3,
};

const STORAGE_KEY = "holy-crush-shop-ads";

type Progress = Record<ShopAdId, number>;

const emptyProgress = (): Progress => ({
  energy: 0,
  moves: 0,
  super: 0,
  mega: 0,
  ultra: 0,
  maxi: 0,
});

const readProgress = (): Progress => {
  if (typeof window === "undefined") return emptyProgress();

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return emptyProgress();

  try {
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const fresh = emptyProgress();

    (Object.keys(fresh) as ShopAdId[]).forEach((id) => {
      fresh[id] = Math.max(0, Math.floor(Number(parsed[id]) || 0));
    });

    return fresh;
  } catch {
    return emptyProgress();
  }
};

const writeProgress = (progress: Progress) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  notifyLocalSave();
};

export const setShopAdProgress = (progress: Partial<Progress>): void => {
  const next = emptyProgress();
  const current = readProgress();

  (Object.keys(next) as ShopAdId[]).forEach((id) => {
    next[id] = Math.max(0, Math.floor(Number(progress[id] ?? current[id]) || 0));
  });

  writeProgress(next);
};

export const getShopAdProgress = (): Progress => readProgress();

/** Un avviso in più. true solo quando il cerchio si chiude e l'oggetto si ottiene. */
export const watchShopAd = (id: ShopAdId, needed: number): boolean => {
  const progress = readProgress();
  const next = progress[id] + 1;

  if (next >= needed) {
    progress[id] = 0;
    writeProgress(progress);

    return true;
  }

  progress[id] = next;
  writeProgress(progress);

  return false;
};
