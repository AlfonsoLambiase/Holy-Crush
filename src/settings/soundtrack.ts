import {isMusicEnabled} from "./music";

const TRACKS = {
  home: {src: "/sounds/ost_0.mp3", volume: 0.65},
  stage: {src: "/sounds/ost_1.mp3", volume: 0.65},
  game: {src: "/sounds/ost_2.mp3", volume: 0.32},
} as const;

export type MusicTrack = keyof typeof TRACKS;

let audio: HTMLAudioElement | null = null;
let current: MusicTrack | null = null;
let queued: MusicTrack | null = null;
let attempt = 0;
let inFlight = false;
let gestureArmed = false;

const element = (): HTMLAudioElement => {
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
  }

  return audio;
};

const sameFile = (src: string): boolean => element().src.endsWith(src);

const gestureActive = (): boolean => navigator.userActivation?.isActive === true;

export const getMusicTrack = (): MusicTrack | null => current;

const armGesture = () => {
  if (gestureArmed) return;

  gestureArmed = true;

  window.addEventListener(
    "pointerdown",
    () => {
      gestureArmed = false;

      const track = queued;

      queued = null;

      if (track) playTrack(track);
    },
    {once: true},
  );
};

export const playTrack = (track: MusicTrack) => {
  if (typeof window === "undefined" || !isMusicEnabled()) {
    stopTrack();

    return;
  }

  const next = TRACKS[track];
  const el = element();
  const same = current === track && sameFile(next.src);

  if (same && (!el.paused || inFlight)) return;

  current = track;

  if (!gestureActive()) {
    queued = track;
    armGesture();

    return;
  }

  el.volume = next.volume;

  if (!sameFile(next.src)) el.src = next.src;

  const token = ++attempt;

  inFlight = true;

  void el.play()
    .then(() => {
      if (token === attempt) inFlight = false;
    })
    .catch(() => {
      if (token !== attempt) return;

      inFlight = false;

      if (current !== track) return;

      queued = track;
      armGesture();
    });
};

export const stopTrack = () => {
  attempt += 1;
  inFlight = false;
  queued = null;
  current = null;
  audio?.pause();
};
