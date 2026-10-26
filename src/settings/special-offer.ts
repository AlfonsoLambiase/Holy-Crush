import {addBooster, BOOSTER_MAX, getBoosterCount, type BoosterId} from "./boosters";
import {notifyLocalSave} from "./local-save-signal";

export const SPECIAL_OFFER_LEVEL_INTERVAL = 7;
export const SPECIAL_OFFER_ADS_REQUIRED = 3;
export const SPECIAL_OFFER_ITEM_COUNT = 5;

const OFFER_PRIORITY: BoosterId[] = ["maxi", "ultra", "mega", "super"];

const STORAGE_KEY = "holy-crush-special-offer";

export type SpecialOfferPending = {
  items: BoosterId[];
  adsWatched: number;
};

type StoredState = {
  winsTowardOffer: number;
  pending: SpecialOfferPending | null;
};

const emptyState = (): StoredState => ({winsTowardOffer: 0, pending: null});

const readState = (): StoredState => {
  if (typeof window === "undefined") return emptyState();

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return emptyState();

  try {
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const winsTowardOffer = Math.max(0, Math.floor(Number(parsed.winsTowardOffer) || 0));
    const pendingRaw = parsed.pending;

    if (!pendingRaw || !Array.isArray(pendingRaw.items)) {
      return {winsTowardOffer, pending: null};
    }

    const items = pendingRaw.items.filter(
      (id): id is BoosterId =>
        id === "super" || id === "mega" || id === "maxi" || id === "ultra",
    );

    if (items.length !== SPECIAL_OFFER_ITEM_COUNT) {
      return {winsTowardOffer, pending: null};
    }

    const adsWatched = Math.min(
      SPECIAL_OFFER_ADS_REQUIRED,
      Math.max(0, Math.floor(Number(pendingRaw.adsWatched) || 0)),
    );

    return {winsTowardOffer, pending: {items, adsWatched}};
  } catch {
    return emptyState();
  }
};

const writeState = (state: StoredState) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  notifyLocalSave();
};

export const countSpecialOfferSlots = (): number => {
  let total = 0;

  for (const id of OFFER_PRIORITY) {
    total += Math.max(0, BOOSTER_MAX - getBoosterCount(id));
  }

  return total;
};

/** Riempie fino a 5 slot liberi, priorità maxi → ultra → mega → super. */
export const buildSpecialOfferItems = (): BoosterId[] | null => {
  const pool: BoosterId[] = [];

  for (const id of OFFER_PRIORITY) {
    const room = BOOSTER_MAX - getBoosterCount(id);

    for (let i = 0; i < room; i += 1) pool.push(id);
  }

  if (pool.length < SPECIAL_OFFER_ITEM_COUNT) return null;

  return pool.slice(0, SPECIAL_OFFER_ITEM_COUNT);
};

export const recordWinTowardSpecialOffer = (): void => {
  const state = readState();

  state.winsTowardOffer += 1;
  writeState(state);
};

export const getSpecialOfferPending = (): SpecialOfferPending | null => readState().pending;

export const getSpecialOfferAdProgress = (): number =>
  readState().pending?.adsWatched ?? 0;

/** Torna alla mappa stage dopo una vittoria: crea o riprende l'offerta da mostrare. */
export const resolveSpecialOfferForStageEntry = (): SpecialOfferPending | null => {
  const state = readState();

  if (state.pending) return state.pending;

  if (state.winsTowardOffer < SPECIAL_OFFER_LEVEL_INTERVAL) return null;

  const items = buildSpecialOfferItems();

  state.winsTowardOffer = 0;

  if (!items) {
    writeState(state);

    return null;
  }

  state.pending = {items, adsWatched: 0};
  writeState(state);

  return state.pending;
};

export const forfeitSpecialOffer = (): void => {
  const state = readState();

  state.pending = null;
  writeState(state);
};

/** Dopo un annuncio completato. true = terzo annuncio, premi consegnati. */
export const recordSpecialOfferAdCompleted = (): boolean => {
  const state = readState();

  if (!state.pending) return false;

  state.pending.adsWatched = Math.min(
    SPECIAL_OFFER_ADS_REQUIRED,
    state.pending.adsWatched + 1,
  );

  const done = state.pending.adsWatched >= SPECIAL_OFFER_ADS_REQUIRED;

  if (!done) {
    writeState(state);

    return false;
  }

  const items = [...state.pending.items];

  state.pending = null;
  writeState(state);

  for (const id of items) addBooster(id);

  return true;
};

export const readSpecialOfferSave = (): StoredState => readState();

export const writeSpecialOfferSave = (save: Partial<StoredState>): void => {
  const current = readState();
  const winsTowardOffer = Math.max(
    0,
    Math.floor(Number(save.winsTowardOffer ?? current.winsTowardOffer) || 0),
  );
  let pending = save.pending === undefined ? current.pending : save.pending;

  if (pending && pending.items.length !== SPECIAL_OFFER_ITEM_COUNT) pending = null;

  writeState({winsTowardOffer, pending});
};
