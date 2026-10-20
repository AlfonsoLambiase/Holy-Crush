const STORAGE_KEY = "holy-crush-home-play-tutorial-seen";

export const shouldShowHomePlayTutorial = (): boolean => {
  if (typeof window === "undefined") return false;

  return localStorage.getItem(STORAGE_KEY) !== "1";
};

export const markHomePlayTutorialSeen = (): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, "1");
};
