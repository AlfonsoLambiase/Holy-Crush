const STORAGE_KEY = "holy-crush-music";

export const isMusicEnabled = (): boolean => {
  if (typeof window === "undefined") return true;

  return localStorage.getItem(STORAGE_KEY) !== "off";
};

export const setMusicEnabled = (enabled: boolean) => {
  localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
};
