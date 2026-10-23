import {notifyLocalSave} from "./local-save-signal";

const STORAGE_KEY = "holy-crush-effects";

export const isEffectsEnabled = (): boolean => {
  if (typeof window === "undefined") return true;

  return localStorage.getItem(STORAGE_KEY) !== "off";
};

export const setEffectsEnabled = (enabled: boolean) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  notifyLocalSave();
};
