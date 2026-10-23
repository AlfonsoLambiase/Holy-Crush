import {notifyLocalSave} from "@/settings/local-save-signal";

const STORAGE_KEY = "holy-crush-tutorial-seen";

export const isTutorialSeen = (): boolean =>
  typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";

export const setTutorialSeen = (seen: boolean): void => {
  if (typeof window === "undefined") return;

  if (seen) localStorage.setItem(STORAGE_KEY, "1");
  else localStorage.removeItem(STORAGE_KEY);

  notifyLocalSave();
};
