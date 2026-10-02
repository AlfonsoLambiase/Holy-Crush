"use client";

import Image from "next/image";
import {useEffect, useState} from "react";

import {playClick} from "@/settings/click";
import {getHeartRemaining} from "@/settings/heart";
import {computeStageHudMetrics, type StageHudMetrics} from "@/settings/stage-hud-layout";
import {STAGE_UI} from "@/settings/stage-ui-paths";

type StageHudBarProps = {
  onExit: () => void;
};

const defaultMetrics = (): StageHudMetrics => ({
  headerCenterY: 58,
  heartSize: 62,
  buttonSize: 44,
  insetX: 52,
});

function HudIconButton({
  alt,
  edge,
  inset,
  size,
  src,
  onClick,
}: {
  alt: string;
  edge: "left" | "right";
  inset: number;
  size: number;
  src: string;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      aria-label={alt}
      className="absolute top-1/2 block shrink-0 border-0 bg-transparent p-0 transition-transform duration-100"
      style={{
        width: size,
        height: size,
        [edge]: inset,
        transform: `translateY(-50%) ${pressed ? "scale(0.92)" : "scale(1)"}`,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        setPressed(true);
        playClick();
      }}
      onPointerLeave={() => setPressed(false)}
      onPointerUp={(event) => {
        event.stopPropagation();
        setPressed(false);
        onClick();
      }}
    >
      <Image alt={alt} className="object-contain" fill sizes="4rem" src={src} />
    </button>
  );
}

function StageHeartMeter({size}: {size: number}) {
  const [remaining, setRemaining] = useState(1);

  useEffect(() => {
    const sync = () => setRemaining(getHeartRemaining());

    sync();
    const timer = window.setInterval(sync, 400);

    return () => window.clearInterval(timer);
  }, []);

  const wedge =
    remaining >= 1
      ? undefined
      : `conic-gradient(from -90deg, #000 0deg, #000 ${remaining * 360}deg, transparent ${remaining * 360}deg)`;

  return (
    <div
      aria-hidden
      className="absolute left-1/2 top-1/2 shrink-0 -translate-x-1/2 -translate-y-1/2"
      style={{height: size, width: size}}
    >
      <Image
        alt=""
        className="object-contain"
        fill
        priority
        sizes="5rem"
        src={STAGE_UI.heartBg}
      />
      {remaining > 0.001 ? (
        <div
          className="absolute inset-0"
          style={{
            WebkitMaskImage: wedge,
            maskImage: wedge,
          }}
        >
          <Image
            alt=""
            className="object-contain"
            fill
            sizes="5rem"
            src={STAGE_UI.heartFill}
          />
        </div>
      ) : null}
    </div>
  );
}

export function StageHudBar({onExit}: StageHudBarProps) {
  const [metrics, setMetrics] = useState<StageHudMetrics>(defaultMetrics);

  useEffect(() => {
    const sync = () => {
      setMetrics(computeStageHudMetrics(window.innerWidth, window.innerHeight));
    };

    sync();
    window.addEventListener("resize", sync);

    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <header
      className="pointer-events-none absolute inset-x-0 z-30"
      style={{
        top: metrics.headerCenterY,
        height: Math.max(metrics.buttonSize, metrics.heartSize),
        transform: "translateY(-50%)",
      }}
    >
      <div className="pointer-events-auto relative h-full w-full">
        <StageHeartMeter size={metrics.heartSize} />
        <HudIconButton
          alt="Esci"
          edge="right"
          inset={metrics.insetX}
          size={metrics.buttonSize}
          src={STAGE_UI.btnExitGame}
          onClick={onExit}
        />
      </div>
    </header>
  );
}
