import {isMusicEnabled} from "./music";
import {getWorldIndexForStage, WORLD_COUNT} from "./world-map";

const TRACKS = {
  home: {src: "/sounds/ost_0.mp3", volume: 0.65},
  game: {src: "/sounds/ost_2.mp3", volume: 0.32},
  world0: {src: "/sounds/ost_1.mp3", volume: 0.65},
  world1: {src: "/sounds/ost_4.mp3", volume: 0.65},
  world2: {src: "/sounds/ost_5.mp3", volume: 0.65},
  world3: {src: "/sounds/ost_6.mp3", volume: 0.65},
  world4: {src: "/sounds/ost_3.mp3", volume: 0.65},
} as const;

export type MusicTrack = keyof typeof TRACKS;

const WORLD_TRACKS: MusicTrack[] = ["world0", "world1", "world2", "world3", "world4"];

let audio: HTMLAudioElement | null = null;
let current: MusicTrack | null = null;
let queued: MusicTrack | null = null;
let attempt = 0;
let inFlight = false;
let gestureArmed = false;

/** Riprende ogni traccia dove era stata interrotta (es. stage dopo un livello). */
const resumeAt = new Map<MusicTrack, number>();

const element = (): HTMLAudioElement => {
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
  }

  return audio;
};

const sameFile = (src: string): boolean => element().src.endsWith(src);

const rememberPosition = (track: MusicTrack | null): void => {
  if (!track || !audio) return;

  const t = audio.currentTime;

  if (Number.isFinite(t) && t > 0) resumeAt.set(track, t);
};

const applyResumePosition = (el: HTMLAudioElement, track: MusicTrack): void => {
  const saved = resumeAt.get(track);

  if (saved == null || saved <= 0) return;

  const seek = () => {
    const duration = el.duration;

    if (!Number.isFinite(duration) || duration <= 0) return;

    if (saved < duration - 0.25) el.currentTime = saved;
  };

  if (el.readyState >= HTMLMediaElement.HAVE_METADATA) seek();
  else el.addEventListener("loadedmetadata", seek, {once: true});
};

export const getMusicTrack = (): MusicTrack | null => current;

/** OST del mondo (world_0 → ost_1 … world_4 → ost_3). */
export const worldMusicTrack = (worldIndex: number): MusicTrack => {
  const safe = Math.min(Math.max(Math.floor(worldIndex), 0), WORLD_COUNT - 1);

  return WORLD_TRACKS[safe] ?? "world0";
};

export const playWorldTrack = (worldIndex: number): void => {
  playTrack(worldMusicTrack(worldIndex));
};

/** `stageIndex` 0-based: usa l’OST del mondo che contiene quello stage. */
export const playStageTrack = (stageIndex: number): void => {
  playWorldTrack(getWorldIndexForStage(stageIndex));
};

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

const startPlayback = (track: MusicTrack, token: number): void => {
  const el = element();

  inFlight = true;

  void el
    .play()
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

export const playTrack = (track: MusicTrack) => {
  if (typeof window === "undefined" || !isMusicEnabled()) {
    stopTrack();

    return;
  }

  const next = TRACKS[track];
  const el = element();
  const sameTrack = current === track && sameFile(next.src);

  if (sameTrack && inFlight) return;

  if (sameTrack && !el.paused) return;

  if (sameTrack && el.paused) {
    el.volume = next.volume;
    startPlayback(track, ++attempt);

    return;
  }

  if (current && current !== track) rememberPosition(current);

  current = track;
  el.volume = next.volume;

  if (!sameFile(next.src)) el.src = next.src;

  applyResumePosition(el, track);

  startPlayback(track, ++attempt);
};

export const stopTrack = () => {
  attempt += 1;
  inFlight = false;
  queued = null;
  current = null;
  resumeAt.clear();
  audio?.pause();
};
