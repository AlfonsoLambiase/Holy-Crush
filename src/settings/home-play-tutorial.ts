import {notifyLocalSave} from "./local-save-signal";

const STORAGE_KEY = "holy-crush-home-play-tutorial-seen";

export const shouldShowHomePlayTutorial = (): boolean => {
  if (typeof window === "undefined") return false;

  return localStorage.getItem(STORAGE_KEY) !== "1";
};

export const setHomePlayTutorialSeen = (seen: boolean): void => {
  if (typeof window === "undefined") return;

  if (seen) localStorage.setItem(STORAGE_KEY, "1");
  else localStorage.removeItem(STORAGE_KEY);

  notifyLocalSave();
};

export const markHomePlayTutorialSeen = (): void => {
  setHomePlayTutorialSeen(true);
};
