"use client";

import Image from "next/image";
import {useEffect, useState} from "react";

import {PhaserGame} from "./PhaserGame";

const INTRO_HOLD_MS = 900; // quanto resta grande al centro prima di salire
const INTRO_MOVE_MS = 1100; // durata della risalita

export function HomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroDone(true), INTRO_HOLD_MS);

    return () => clearTimeout(timer);
  }, []);

  if (isPlaying) {
    return <PhaserGame onExit={() => setIsPlaying(false)} />;
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[url('/home/background.png')] bg-cover bg-center bg-no-repeat">
      <div
        className="absolute left-1/2 top-0 w-[82%] max-w-sm ease-out"
        style={{
          transition: `transform ${INTRO_MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          transform: isIntroDone
            ? "translate(-50%, 1vh) scale(0.62)"
            : "translate(-50%, calc(50dvh - 50%)) scale(1)",
        }}
      >
        <Image
          alt="Holy Crush"
          className="h-auto w-full drop-shadow-xl"
          height={702}
          priority
          src="/home/logo.png"
          width={942}
        />
      </div>

      <button
        className={`absolute bottom-[16vh] left-1/2 -translate-x-1/2 rounded-full bg-[#ffd76a] px-16 py-5 text-2xl font-bold text-[#140d2d] shadow-lg transition-all duration-500 active:scale-95 ${
          isIntroDone ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{transitionDelay: isIntroDone ? `${INTRO_MOVE_MS * 0.6}ms` : "0ms"}}
        type="button"
        onClick={() => setIsPlaying(true)}
      >
        GIOCA
      </button>
    </div>
  );
}
