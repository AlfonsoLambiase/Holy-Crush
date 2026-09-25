import {isEffectsEnabled} from "./effects";

const clips = new Map<string, HTMLAudioElement>();

const playSfx = (src: string) => {
  if (typeof window === "undefined" || !isEffectsEnabled()) return;

  let clip = clips.get(src);

  if (!clip) {
    clip = new Audio(src);
    clips.set(src, clip);
  }

  clip.currentTime = 0;
  void clip.play().catch(() => {});
};

export const playClick = () => playSfx("/sounds/click.mp3");

export const playNoTouch = () => playSfx("/sounds/noTouch.mp3");
