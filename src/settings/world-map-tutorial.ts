const STORAGE_KEY = "holy-crush-world-map-tutorial-seen";

export const shouldShowWorldMapTutorial = (): boolean => {
  if (typeof window === "undefined") return false;

  return localStorage.getItem(STORAGE_KEY) !== "1";
};

export const markWorldMapTutorialSeen = (): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, "1");
};
