/** Link pubblico del gioco (placeholder finché non c’è URL definitivo). */
export const GAME_SHARE_URL = "";

export const resolveGameShareUrl = (): string => {
  if (GAME_SHARE_URL.trim()) return GAME_SHARE_URL.trim();

  if (typeof window === "undefined") return "";

  return window.location.href;
};
