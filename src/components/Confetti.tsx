"use client";

import {forwardRef, useCallback, useImperativeHandle, useRef} from "react";
import confetti from "canvas-confetti";

export type ConfettiRef = {
  fire: (options?: confetti.Options) => void;
};

type ConfettiProps = React.ComponentPropsWithoutRef<"canvas"> & {
  options?: confetti.Options;
};

const WIN_COLORS = ["#f6c945", "#ffffff", "#9fd4f5"];
const WIN_BURST = {
  colors: WIN_COLORS,
  ticks: 80,
  gravity: 1.2,
  startVelocity: 36,
};

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(function Confetti(
  {options, ...rest},
  ref,
) {
  const instanceRef = useRef<confetti.CreateTypes | null>(null);

  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (!node) {
      instanceRef.current?.reset();
      instanceRef.current = null;

      return;
    }

    if (instanceRef.current) return;

    instanceRef.current = confetti.create(node, {resize: true, useWorker: false});
  }, []);

  const fire = useCallback(
    (opts: confetti.Options = {}) => {
      void instanceRef.current?.({disableForReducedMotion: true, ...options, ...opts});
    },
    [options],
  );

  useImperativeHandle(ref, () => ({fire}), [fire]);

  return <canvas ref={canvasRef} {...rest} />;
});

//* Tre scoppi brevi: centro, lati, centro.
export const playWinConfetti = (api: ConfettiRef): (() => void) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const timers: number[] = [];

  api.fire({...WIN_BURST, particleCount: 50, spread: 68, origin: {y: 0.55}});

  timers.push(
    window.setTimeout(() => {
      api.fire({
        ...WIN_BURST,
        particleCount: 24,
        angle: 60,
        spread: 50,
        origin: {x: 0.15, y: 0.65},
      });
      api.fire({
        ...WIN_BURST,
        particleCount: 24,
        angle: 120,
        spread: 50,
        origin: {x: 0.85, y: 0.65},
      });
    }, 160),
  );

  timers.push(
    window.setTimeout(() => {
      api.fire({...WIN_BURST, particleCount: 36, spread: 80, origin: {y: 0.45}});
    }, 320),
  );

  return () => {
    for (const id of timers) window.clearTimeout(id);
  };
};
