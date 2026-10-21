import {getClearedCount} from "./progress";

const FILL_STEP = 0.1;
/** Uno spicchio (partita) ogni 10 minuti */
export const HEART_REGEN_INTERVAL_MS = 10 * 60 * 1000;

const HEART_KEY = "holy-crush-heart";
const HEART_CREDIT_KEY = "holy-crush-heart-credit";
const HEART_REGEN_AT_KEY = "holy-crush-heart-regen-at";

const FULL_EPSILON = 0.001;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

//* 0.1 in serie sborda sul float: lo riallineo allo spicchio
const roundStep = (value: number) => Math.round(clamp01(value) / FILL_STEP) * FILL_STEP;

const isFull = (value: number) => value >= 1 - FULL_EPSILON;

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

const readRegenAnchor = (): number | null => {
  if (typeof window === "undefined") return null;

  const value = Number(localStorage.getItem(HEART_REGEN_AT_KEY));

  return Number.isFinite(value) && value > 0 ? value : null;
};

const writeRegenAnchor = (timestamp: number) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(HEART_REGEN_AT_KEY, String(Math.floor(timestamp)));
};

const ensureRegenAnchor = (now: number) => {
  if (readRegenAnchor() === null) writeRegenAnchor(now);
};

/** +0.1 per ogni intervallo trascorso (anche con app chiusa). In pausa a cuore pieno. */
const applyPassiveRegen = (): void => {
  if (typeof window === "undefined") return;

  let remaining = readStored();

  if (remaining === null || isFull(remaining)) return;

  const now = Date.now();

  ensureRegenAnchor(now);

  const anchor = readRegenAnchor();

  if (anchor === null) return;

  const ticks = Math.floor((now - anchor) / HEART_REGEN_INTERVAL_MS);

  if (ticks <= 0) return;

  remaining = roundStep(Math.min(1, remaining + ticks * FILL_STEP));
  writeStored(remaining);

  if (isFull(remaining)) writeRegenAnchor(now);
  else writeRegenAnchor(anchor + ticks * HEART_REGEN_INTERVAL_MS);
};

//* Salvataggi vecchi: il credito compensava i livelli già aperti, ma restava
//* anche quando lo stage ripartiva da zero e il cuore non scendeva più
const legacyRemaining = (): number => clamp01(1 - getClearedCount() * FILL_STEP + readCredit());

const readRemainingRaw = (): number => {
  const stored = readStored();

  if (stored !== null) return stored;

  const migrated = legacyRemaining();

  writeStored(migrated);

  return migrated;
};

export const getHeartRemaining = (): number => {
  readRemainingRaw();
  applyPassiveRegen();

  return readStored() ?? 0;
};

export const isHeartEmpty = (): boolean => getHeartRemaining() <= FULL_EPSILON;

export const refillHeart = (): void => {
  writeStored(1);
};

export const spendHeart = (): void => {
  const before = getHeartRemaining();
  const after = roundStep(before - FILL_STEP);

  writeStored(after);

  if (isFull(before)) writeRegenAnchor(Date.now());
  else if (!isFull(after)) ensureRegenAnchor(Date.now());
};
