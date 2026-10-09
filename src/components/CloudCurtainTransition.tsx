"use client";

import Image from "next/image";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import {playCloudOff, playCloudOn} from "@/settings/click";

export const CLOUD_CURTAIN_GROUP_SRC = "/images/ui_home/clouds_group.png";
export const CLOUD_CURTAIN_GROUP_WIDTH = 1774;
export const CLOUD_CURTAIN_GROUP_HEIGHT = 1920;

export const CLOUD_CURTAIN_STACK_COUNT = 2;

/** Offset verticale tra i PNG sovrapposti (px, dimensione nativa). */
const STACK_OVERLAP_PX = 640;

/** Quanto restano fuori schermo a riposo (entrambi i layer invisibili). */
const HIDE_GAP_VW = 24;

/** Chiusura di riferimento (~430px viewport): valori attuali che vanno bene. */
export const CLOUD_CURTAIN_CLOSED_INSET_VW = 170;

const CLOSED_REF_VIEWPORT_W = 430;
const CLOSED_NARROW_VIEWPORT_W = 320;
/** Estremo stretto (→320px): un filo più chiuso; ~375 resta quasi al baseline. */
const CLOSED_NARROW_INSET_VW = 234;
const CLOSED_TABLET_FROM_W = 520;
const CLOSED_TABLET_TO_W = 1180;
/** Tablet: chiusura molto più soft (inset basso = ali meno sovrapposte). */
const CLOSED_TABLET_INSET_VW = 104;
const CLOSED_ULTRA_WIDE_W = 1280;
const CLOSED_ULTRA_WIDE_INSET_VW = 118;
const CLOSED_NARROW_OVERLAP_REM = 7.75;
const CLOSED_NARROW_IMG_MIN_VW = 134;

type ClosedCloudLayout = {
  insetVw: number;
  centerOverlapRem: number;
  imageMinWidthVw: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Più stretto → chiude di più; molto largo → un po’ meno del baseline. */
export const closedCloudLayoutForViewport = (viewportWidth: number): ClosedCloudLayout => {
  const w = Math.max(280, viewportWidth);

  if (w <= CLOSED_REF_VIEWPORT_W) {
    const tLinear = clamp01(
      (CLOSED_REF_VIEWPORT_W - w) / (CLOSED_REF_VIEWPORT_W - CLOSED_NARROW_VIEWPORT_W),
    );
    // Effetto concentrato sugli schermi molto stretti (375 quasi invariato).
    const t = tLinear ** 1.85;

    return {
      insetVw: lerp(CLOUD_CURTAIN_CLOSED_INSET_VW, CLOSED_NARROW_INSET_VW, t),
      centerOverlapRem: lerp(0, CLOSED_NARROW_OVERLAP_REM, t),
      imageMinWidthVw: lerp(0, CLOSED_NARROW_IMG_MIN_VW, t),
    };
  }

  if (w < CLOSED_TABLET_FROM_W) {
    const t = clamp01((w - CLOSED_REF_VIEWPORT_W) / (CLOSED_TABLET_FROM_W - CLOSED_REF_VIEWPORT_W));

    return {
      insetVw: lerp(CLOUD_CURTAIN_CLOSED_INSET_VW, CLOSED_TABLET_INSET_VW, t),
      centerOverlapRem: 0,
      imageMinWidthVw: 0,
    };
  }

  if (w <= CLOSED_TABLET_TO_W) {
    return {
      insetVw: CLOSED_TABLET_INSET_VW,
      centerOverlapRem: 0,
      imageMinWidthVw: 0,
    };
  }

  const t = clamp01((w - CLOSED_TABLET_TO_W) / (CLOSED_ULTRA_WIDE_W - CLOSED_TABLET_TO_W));

  return {
    insetVw: lerp(CLOSED_TABLET_INSET_VW, CLOSED_ULTRA_WIDE_INSET_VW, t),
    centerOverlapRem: 0,
    imageMinWidthVw: 0,
  };
};

function useViewportWidth(): number {
  const [width, setWidth] = useState(CLOSED_REF_VIEWPORT_W);

  useEffect(() => {
    const sync = () => setWidth(window.innerWidth);

    sync();
    window.addEventListener("resize", sync);

    return () => window.removeEventListener("resize", sync);
  }, []);

  return width;
}

export const CLOUD_CURTAIN_TRANSITION_MS = 2200;
export const CLOUD_CURTAIN_STAGGER_MS = 130;
export const CLOUD_CURTAIN_HOLD_MS = 500;

export type CloudCurtainPhase = "idle" | "closing" | "open" | "opening";

type CloudCurtainTransitionProps = {
  phase: CloudCurtainPhase;
  onClosingComplete?: () => void;
  onOpeningComplete?: () => void;
  hidden?: boolean;
};

type CloudFloatProps = {
  side: "left" | "right";
  layerIndex: number;
  topPx: number;
  isClosed: boolean;
  motion: CloudCurtainPhase;
  onTransitionEnd?: (event: React.TransitionEvent<HTMLDivElement>) => void;
};

function CloudFloat({
  side,
  layerIndex,
  topPx,
  isClosed,
  motion,
  onTransitionEnd,
}: CloudFloatProps) {
  const isLeft = side === "left";
  const hideGapVw = HIDE_GAP_VW + layerIndex * 3;
  const openX = isLeft
    ? `calc(-100% - ${hideGapVw}vw)`
    : `calc(100% + ${hideGapVw}vw)`;
  return (
    <div
      aria-hidden
      className={`cloud-curtain-float cloud-curtain-float--${side} ${isClosed ? "is-closed" : ""}`}
      data-index={layerIndex}
      data-motion={motion}
      style={
        {
          top: topPx,
          ["--cloud-open-x" as string]: openX,
          ["--cloud-closed-x" as string]: isLeft
            ? "var(--cloud-closed-x-left)"
            : "var(--cloud-closed-x-right)",
        } as React.CSSProperties
      }
      onTransitionEnd={onTransitionEnd}
    >
      <Image
        alt=""
        className={`cloud-curtain-float__img ${isLeft ? "-scale-x-100" : ""}`}
        height={CLOUD_CURTAIN_GROUP_HEIGHT}
        priority
        src={CLOUD_CURTAIN_GROUP_SRC}
        width={CLOUD_CURTAIN_GROUP_WIDTH}
      />
    </div>
  );
}

function CloudSide({
  side,
  isClosed,
  motion,
  stackHeight,
  onLayerTransitionEnd,
}: {
  side: "left" | "right";
  isClosed: boolean;
  motion: CloudCurtainPhase;
  stackHeight: number;
  onLayerTransitionEnd?: (
    event: React.TransitionEvent<HTMLDivElement>,
    layerIndex: number,
  ) => void;
}) {
  const stackTop = `calc(50% - ${stackHeight / 2}px)`;

  return (
    <div
      aria-hidden
      className={`cloud-curtain-side cloud-curtain-side--${side}`}
      style={{height: stackHeight, top: stackTop}}
    >
      {Array.from({length: CLOUD_CURTAIN_STACK_COUNT}, (_, layerIndex) => (
        <CloudFloat
          key={`${side}-${layerIndex}`}
          isClosed={isClosed}
          layerIndex={layerIndex}
          motion={motion}
          side={side}
          topPx={layerIndex * STACK_OVERLAP_PX}
          onTransitionEnd={
            onLayerTransitionEnd
              ? (event) => onLayerTransitionEnd(event, layerIndex)
              : undefined
          }
        />
      ))}
    </div>
  );
}

export function CloudCurtainTransition({
  phase,
  onClosingComplete,
  onOpeningComplete,
  hidden = false,
}: CloudCurtainTransitionProps) {
  const wingsClosed = phase === "closing" || phase === "open";
  const phaseRef = useRef(phase);
  const prevPhaseRef = useRef<CloudCurtainPhase>("idle");

  phaseRef.current = phase;

  useEffect(() => {
    if (hidden) return;

    const prev = prevPhaseRef.current;

    prevPhaseRef.current = phase;

    if (phase === "closing" && prev !== "closing") {
      playCloudOn();
    }

    if (phase === "opening" && prev !== "opening") {
      playCloudOff();
    }
  }, [phase, hidden]);

  const viewportWidth = useViewportWidth();
  const closedLayout = useMemo(
    () => closedCloudLayoutForViewport(viewportWidth),
    [viewportWidth],
  );

  const stackHeight = useMemo(
    () => CLOUD_CURTAIN_GROUP_HEIGHT + (CLOUD_CURTAIN_STACK_COUNT - 1) * STACK_OVERLAP_PX,
    [],
  );

  useEffect(() => {
    if (hidden) return;

    const img = new window.Image();
    img.src = CLOUD_CURTAIN_GROUP_SRC;
  }, [hidden]);

  const handleLayerTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>, layerIndex: number) => {
      if (event.propertyName !== "transform") return;
      if (event.target !== event.currentTarget) return;

      const current = phaseRef.current;
      const lastIndex = CLOUD_CURTAIN_STACK_COUNT - 1;

      if (current === "closing" && layerIndex === lastIndex) {
        onClosingComplete?.();
        return;
      }

      if (current === "opening" && layerIndex === 0) {
        onOpeningComplete?.();
      }
    },
    [onClosingComplete, onOpeningComplete],
  );

  if (hidden) return null;

  return (
    <div
      aria-hidden
      className="cloud-curtain-root pointer-events-none fixed inset-0 z-[45]"
      data-phase={phase}
      style={
        {
          ["--cloud-closed-inset-vw" as string]: String(closedLayout.insetVw),
          ["--cloud-center-overlap-rem" as string]: `${closedLayout.centerOverlapRem}rem`,
          ["--cloud-img-min-width-vw" as string]: String(closedLayout.imageMinWidthVw),
          ["--cloud-curtain-duration" as string]: `${CLOUD_CURTAIN_TRANSITION_MS}ms`,
          ["--cloud-curtain-stagger" as string]: `${CLOUD_CURTAIN_STAGGER_MS}ms`,
        } as React.CSSProperties
      }
    >
      <CloudSide
        isClosed={wingsClosed}
        motion={phase}
        side="left"
        stackHeight={stackHeight}
        onLayerTransitionEnd={handleLayerTransitionEnd}
      />
      <CloudSide isClosed={wingsClosed} motion={phase} side="right" stackHeight={stackHeight} />
    </div>
  );
}
