import {isEffectsEnabled} from "./effects";

const clips = new Map<string, HTMLAudioElement>();

/** Taglio iniziale silenzio (3 decisecondi = 0,3s). */
const SFX_LEAD_TRIM_SEC = 0.3;

const CLOUD_ON_START_VOLUME = 0.36;
const CLOUD_ON_FADE_MS = 560;

let cloudOnFadeFrame = 0;

const getClip = (src: string): HTMLAudioElement => {
  let clip = clips.get(src);

  if (!clip) {
    clip = new Audio(src);
    clips.set(src, clip);
  }

  return clip;
};

const playSfx = (src: string, startSec = 0) => {
  if (typeof window === "undefined" || !isEffectsEnabled()) return;

  const clip = getClip(src);

  const seekAndPlay = () => {
    const duration = clip.duration;

    clip.volume = 1;
    clip.currentTime =
      Number.isFinite(duration) && duration > startSec + 0.05
        ? startSec
        : Math.min(startSec, Math.max(0, duration - 0.05));

    void clip.play().catch(() => {});
  };

  if (clip.readyState >= HTMLMediaElement.HAVE_METADATA) {
    seekAndPlay();

    return;
  }

  clip.addEventListener("loadedmetadata", seekAndPlay, {once: true});
};

export const playClick = () => playSfx("/sounds/click.mp3");

export const playNoTouch = () => playSfx("/sounds/noTouch.mp3");

export const playSwitch = () => playSfx("/sounds/switch.mp3");

export const playRecharge = () => playSfx("/sounds/recharge.mp3");

export const playSuper = () => playSfx("/sounds/super.mp3");

export const playMega = () => playSfx("/sounds/mega.mp3");

export const playCloudOn = () => {
  if (typeof window === "undefined" || !isEffectsEnabled()) return;

  const src = "/sounds/cloud_on.mp3";
  const clip = getClip(src);

  const seekAndPlay = () => {
    cancelAnimationFrame(cloudOnFadeFrame);
    clip.currentTime = 0;
    clip.volume = CLOUD_ON_START_VOLUME;

    void clip.play().catch(() => {});

    const fadeStart = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - fadeStart) / CLOUD_ON_FADE_MS);

      clip.volume = CLOUD_ON_START_VOLUME + (1 - CLOUD_ON_START_VOLUME) * progress;

      if (progress < 1) {
        cloudOnFadeFrame = requestAnimationFrame(tick);
      } else {
        clip.volume = 1;
      }
    };

    cloudOnFadeFrame = requestAnimationFrame(tick);
  };

  if (clip.readyState >= HTMLMediaElement.HAVE_METADATA) {
    seekAndPlay();

    return;
  }

  clip.addEventListener("loadedmetadata", seekAndPlay, {once: true});
};

export const playCloudOff = () => playSfx("/sounds/cloud_off.mp3", SFX_LEAD_TRIM_SEC);

export const playBook = () => playSfx("/sounds/book.mp3", SFX_LEAD_TRIM_SEC);

const UNLOCKED_SRC = "/sounds/unlocked.mp3";

export const playUnlocked = (): (() => void) => {
  if (typeof window === "undefined" || !isEffectsEnabled()) {
    return () => {};
  }

  const clip = getClip(UNLOCKED_SRC);

  clip.volume = 1;
  clip.currentTime = 0;
  void clip.play().catch(() => {});

  return () => {
    clip.pause();
    clip.currentTime = 0;
  };
};
