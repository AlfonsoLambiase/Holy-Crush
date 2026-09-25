"use client";

import {useEffect, useRef} from "react";
import type * as PhaserType from "phaser";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const onExitRef = useRef(onExit);

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

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

      EventBus.on(PhaserEvents.EXIT_GAME, handleExit);
      EventBus.on(PhaserEvents.END_GAME, handleExit);

      unbind = () => {
        EventBus.off(PhaserEvents.EXIT_GAME, handleExit);
        EventBus.off(PhaserEvents.END_GAME, handleExit);
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
      game?.destroy(true);
    };
  }, []);

  return <div ref={containerRef} className="h-dvh w-full overflow-hidden" />;
}
