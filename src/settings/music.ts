import {notifyLocalSave} from "./local-save-signal";

const STORAGE_KEY = "holy-crush-music";

export const isMusicEnabled = (): boolean => {
  if (typeof window === "undefined") return true;

  return localStorage.getItem(STORAGE_KEY) !== "off";
};

export const setMusicEnabled = (enabled: boolean) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  notifyLocalSave();
};
