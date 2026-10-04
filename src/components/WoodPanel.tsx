"use client";

import Image from "next/image";
import {useState} from "react";

const POPUP_CLOSE_MS = 260;

type WoodPanelProps = {
  alt: string;
  src?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function WoodPanel({
  alt,
  src = "/ui_home/settingContainer.png",
  children,
  onClose,
  className = "absolute inset-0 z-50",
}: WoodPanelProps) {
  const [leaving, setLeaving] = useState(false);

  const requestClose = () => {
    if (leaving) return;

    setLeaving(true);
    window.setTimeout(onClose, POPUP_CLOSE_MS);
  };

  return (
    <div
      className={`${className} flex items-center justify-center bg-black/55 px-3 ${
        leaving ? "popup-backdrop-out" : "popup-backdrop-in"
      }`}
      onClick={requestClose}
    >
      <div
        className={`relative w-[min(88vw,28rem)] ${leaving ? "popup-panel-out" : "popup-panel-in"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          alt={alt}
          className={`h-auto w-full ${src.includes("gameContainer") ? "" : "drop-shadow-2xl"}`}
          height={1152}
          src={src}
          width={863}
        />
        <div className="absolute inset-[11%] flex flex-col items-center justify-center overflow-hidden px-[6%] text-center">
          {children}
        </div>
      </div>
    </div>
  );
}
