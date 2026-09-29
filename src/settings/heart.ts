import {getClearedCount} from "./progress";

const FILL_STEP = 0.2;
const HEART_KEY = "holy-crush-heart";
const HEART_CREDIT_KEY = "holy-crush-heart-credit";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

//* 0.2 in serie fa 0.19999999999999996: lo riallineo allo spicchio
const roundStep = (value: number) => Math.round(clamp01(value) / FILL_STEP) * FILL_STEP;

const readCredit = (): number => {
  if (typeof window === "undefined") return 0;

  const value = Number(localStorage.getItem(HEART_CREDIT_KEY) ?? "0");

  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

const readStored = (): number | null => {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(HEART_KEY);

  if (raw === null) return null;

  const value = Number(raw);

  return Number.isFinite(value) ? roundStep(value) : null;
};

const writeStored = (value: number) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(HEART_KEY, String(roundStep(value)));
};

//* Salvataggi vecchi: il credito compensava i livelli già aperti, ma restava
//* anche quando lo stage ripartiva da zero e il cuore non scendeva più
const legacyRemaining = (): number => clamp01(1 - getClearedCount() * FILL_STEP + readCredit());

export const getHeartRemaining = (): number => {
  const stored = readStored();

  if (stored !== null) return stored;

  const migrated = legacyRemaining();

  writeStored(migrated);

  return migrated;
};

export const isHeartEmpty = (): boolean => getHeartRemaining() <= 0.001;

export const refillHeart = (): void => {
  writeStored(1);
};

export const spendHeart = (): void => {
  writeStored(getHeartRemaining() - FILL_STEP);
};
