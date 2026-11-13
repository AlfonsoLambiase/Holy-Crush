"use client";

import {useLayoutEffect, useState, type ReactNode} from "react";

import {GoldTitle} from "@/components/GoldTitle";
import {
  PANEL_SECTION_TITLE_CLASS,
  PANEL_STATUS_CLASS,
  PANEL_TITLE_STYLE,
} from "@/components/home-panel-styles";
import {computeExitPopupPlateCssWidth} from "@/settings/exit-popup-layout";
import {WoodPanel} from "./WoodPanel";

const POPUP_SRC = "/images/ui_game/popupExitGame.png";

type GameExitPopupPanelProps = {
  title: string;
  body: string;
  children: ReactNode;
  className?: string;
  zClassName?: string;
};

/** Popup `popupExitGame`: testi come Impostazioni, layout compatto al centro della pergamena. */
export function GameExitPopupPanel({
  title,
  body,
  children,
  className = "fixed inset-0",
  zClassName = "z-[120]",
}: GameExitPopupPanelProps) {
  const [plateWidthPx, setPlateWidthPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const sync = () => {
      setPlateWidthPx(computeExitPopupPlateCssWidth(window.innerWidth, window.innerHeight));
    };

    sync();
    window.addEventListener("resize", sync);

    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <WoodPanel
      alt=""
      backdropClassName="bg-black/55"
      className={`${className} ${zClassName}`}
      contentAlign="center"
      contentClassName="inset-[19%_11%_21%_11%] flex flex-col items-center justify-center overflow-x-hidden px-[2%] py-0"
      dismissible={false}
      panelClassName="max-h-[42dvh] w-[min(82vw,22rem)] shrink-0"
      panelStyle={plateWidthPx ? {width: `${plateWidthPx}px`} : undefined}
      src={POPUP_SRC}
      onClose={() => {}}
    >
      <div className="flex w-full min-w-0 max-w-[14.5rem] flex-col items-center justify-center gap-2 overflow-x-hidden">
        <GoldTitle
          showRules={false}
          className="w-full"
          titleClassName={`${PANEL_SECTION_TITLE_CLASS} text-lg max-[380px]:text-base`}
          titleStyle={PANEL_TITLE_STYLE}
        >
          {title}
        </GoldTitle>
        <p className={`${PANEL_STATUS_CLASS} w-full`} style={PANEL_TITLE_STYLE}>
          {body}
        </p>
        {children}
      </div>
    </WoodPanel>
  );
}
