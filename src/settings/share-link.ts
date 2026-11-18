/** Link ufficiale dell’app. Cambialo qui se arriva un URL diverso (sito, App Store, …). */
export const GAME_SHARE_URL =
  "https://play.google.com/store/apps/details?id=com.orbitagames.holycrush";

export const resolveGameShareUrl = (): string => {
  if (GAME_SHARE_URL.trim()) return GAME_SHARE_URL.trim();

  if (typeof window === "undefined") return "";

  return window.location.href;
};
