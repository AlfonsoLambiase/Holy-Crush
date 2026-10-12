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
  contentAlign?: "center" | "start";
  panelClassName?: string;
  contentClassName?: string;
};

export function WoodPanel({
  alt,
  src = "/images/ui_home/settingContainer.png",
  children,
  onClose,
  className = "absolute inset-0 z-50",
  contentAlign = "center",
  panelClassName = "w-[min(88vw,28rem,calc(92dvh*863/1152))]",
  contentClassName = "inset-[11%] px-[6%] py-1",
}: WoodPanelProps) {
  const [leaving, setLeaving] = useState(false);

  const requestClose = () => {
    if (leaving) return;

    setLeaving(true);
    window.setTimeout(onClose, POPUP_CLOSE_MS);
  };

  return (
    <div
      className={`${className} flex touch-auto items-center justify-center overflow-y-auto bg-black/55 px-3 py-[max(0.5rem,env(safe-area-inset-top))] ${
        leaving ? "popup-backdrop-out" : "popup-backdrop-in"
      }`}
      onClick={requestClose}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
    >
      <div
        className={`relative aspect-[863/1152] ${panelClassName} max-h-[92dvh] shrink-0 ${
          leaving ? "popup-panel-out" : "popup-panel-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          alt={alt}
          className={`h-full w-full object-fill ${src.includes("gameContainer") ? "" : "drop-shadow-2xl"}`}
          height={1152}
          src={src}
          width={863}
        />
        <div
          className={`absolute ${contentClassName} flex min-h-0 flex-col overflow-x-hidden overscroll-y-contain text-center [-webkit-overflow-scrolling:touch] ${
            contentAlign === "start"
              ? "items-stretch justify-start overflow-y-auto"
              : "items-center justify-center overflow-y-auto"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
