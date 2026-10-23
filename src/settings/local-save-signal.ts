/** Timestamp locale per decidere quale copia è più recente. Non è un progresso di gioco. */
export const LOCAL_SAVE_STAMP_KEY = "holy-crush-saved-at";

type Listener = () => void;

let muted = 0;
const levelWonListeners = new Set<Listener>();

export const muteLocalSaveSignal = (): (() => void) => {
  muted += 1;

  return () => {
    muted -= 1;
  };
};

export const notifyLocalSave = (): void => {
  if (typeof window === "undefined" || muted > 0) return;

  localStorage.setItem(LOCAL_SAVE_STAMP_KEY, String(Date.now()));
};

export const notifyLevelWon = (): void => {
  levelWonListeners.forEach((listener) => listener());
};

export const subscribeLevelWon = (listener: Listener): (() => void) => {
  levelWonListeners.add(listener);

  return () => levelWonListeners.delete(listener);
};

export const readLocalSaveStamp = (): number => {
  if (typeof window === "undefined") return 0;

  const value = Number(localStorage.getItem(LOCAL_SAVE_STAMP_KEY));

  return Number.isFinite(value) && value > 0 ? value : 0;
};
