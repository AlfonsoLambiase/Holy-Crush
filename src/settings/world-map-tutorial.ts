import {notifyLocalSave} from "./local-save-signal";

const STORAGE_KEY = "holy-crush-world-map-tutorial-seen";

export const shouldShowWorldMapTutorial = (): boolean => {
  if (typeof window === "undefined") return false;

  return localStorage.getItem(STORAGE_KEY) !== "1";
};

export const setWorldMapTutorialSeen = (seen: boolean): void => {
  if (typeof window === "undefined") return;

  if (seen) localStorage.setItem(STORAGE_KEY, "1");
  else localStorage.removeItem(STORAGE_KEY);

  notifyLocalSave();
};

export const markWorldMapTutorialSeen = (): void => {
  setWorldMapTutorialSeen(true);
};
