"use client";

import {useState} from "react";

import {PhaserGame} from "./PhaserGame";

export function HomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return <PhaserGame onExit={() => setIsPlaying(false)} />;
  }

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-end bg-[url('/game/background.png')] bg-cover bg-center bg-no-repeat pb-[18vh]">
      <button
        className="rounded-full bg-[#ffd76a] px-16 py-5 text-2xl font-bold text-[#140d2d] shadow-lg transition-transform active:scale-95"
        type="button"
        onClick={() => setIsPlaying(true)}
      >
        GIOCA
      </button>
    </div>
  );
}
