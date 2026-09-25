import {isMusicEnabled} from "./music";

const TRACKS = {
  home: {src: "/sounds/ost_0.mp3", volume: 0.65},
  stage: {src: "/sounds/ost_1.mp3", volume: 0.65},
  game: {src: "/sounds/ost_2.mp3", volume: 0.32},
} as const;

export type MusicTrack = keyof typeof TRACKS;

let audio: HTMLAudioElement | null = null;
let current: MusicTrack | null = null;

const element = (): HTMLAudioElement => {
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
  }

  return audio;
};

const sameFile = (src: string): boolean => element().src.endsWith(src);

export const getMusicTrack = (): MusicTrack | null => current;

export const playTrack = (track: MusicTrack) => {
  if (typeof window === "undefined" || !isMusicEnabled()) {
    stopTrack();

    return;
  }

  const next = TRACKS[track];
  const el = element();

  if (current === track && !el.paused && sameFile(next.src)) return;

  current = track;
  el.volume = next.volume;

  if (!sameFile(next.src)) el.src = next.src;

  void el.play().catch(() => {
    const retry = () => {
      if (current !== track || !isMusicEnabled()) return;

      void el.play().then(() => window.removeEventListener("pointerdown", retry));
    };

    window.addEventListener("pointerdown", retry);
  });
};

export const stopTrack = () => {
  audio?.pause();
  current = null;
};
