"use client";

import {useEffect, useRef, useState} from "react";
import type * as PhaserType from "phaser";

import {useLanguage} from "@/language/LanguageProvider";
import {stopTrack} from "@/settings/soundtrack";

type PhaserGameProps = {
  onExit: () => void;
};

//* La griglia lavora in pixel fisici, quindi il notch va convertito con il devicePixelRatio
const readSafeTop = (): number => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--safe-top");

  return (parseFloat(raw) || 0) * window.devicePixelRatio;
};

export function PhaserGame({onExit}: PhaserGameProps) {
  const {t} = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const onExitRef = useRef(onExit);
  const [isLoading, setIsLoading] = useState(true);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    if (!isLoading) return;

    const timer = setInterval(() => setDots((count) => (count + 1) % 4), 420);

    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    let game: PhaserType.Game | undefined;
    let unbind: (() => void) | undefined;
    let disposed = false;

    const start = async () => {
      const [{createGame}, {EventBus, PhaserEvents}] = await Promise.all([
        import("@game/create-game"),
        import("@game/shared/event-bus"),
      ]);

      if (disposed || !containerRef.current) return;

      const handleExit = () => onExitRef.current();
      const handleReady = () => setIsLoading(false);

      EventBus.on(PhaserEvents.EXIT_GAME, handleExit);
      EventBus.on(PhaserEvents.END_GAME, handleExit);
      EventBus.on(PhaserEvents.OPENING_READY, handleReady);

      unbind = () => {
        EventBus.off(PhaserEvents.EXIT_GAME, handleExit);
        EventBus.off(PhaserEvents.END_GAME, handleExit);
        EventBus.off(PhaserEvents.OPENING_READY, handleReady);
      };

      game = createGame({
        parent: containerRef.current,
        safeTop: readSafeTop(),
      });
    };

    void start();

    return () => {
      disposed = true;
      unbind?.();
      stopTrack();
      game?.loop.stop();
      game?.destroy(true);
    };
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#140d2d]">
      <div ref={containerRef} className="h-dvh w-full overflow-hidden" />
      {isLoading && (
        <p className="pointer-events-none absolute inset-x-0 bottom-[9vh] text-center font-display text-lg tracking-wide text-[#fff8dc]">
          {t("loading")}
          <span className="inline-block w-[3ch] text-left">{".".repeat(dots)}</span>
        </p>
      )}
    </div>
  );
}
