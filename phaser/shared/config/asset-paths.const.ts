//* Mappa i nomi logici degli asset sulle cartelle reali dentro /public
export const DEFAULT_STAGE = 1;

//* Immagini comuni a tutti gli stage: stanno in /game invece che in /stage_N
const SHARED_IMAGE_KEYS = new Set([
  "btnCancel",
  "btnConfirm",
  "btnExitGame",
  "btnExitGameBottom",
  "popupExitGame",
  "containerScore",
  "sparklingStars",
  "starsEffect",
]);

export const AssetPaths = {
  image: (key: string, stage: number = DEFAULT_STAGE) =>
    SHARED_IMAGE_KEYS.has(key) ? `/game/${key}.png` : `/stage_${stage}/${key}.png`,
  audio: (key: string) => `/sounds/${key}.mp3`,
  font: (key: string) => `/fonts/${key}.ttf`,
};
