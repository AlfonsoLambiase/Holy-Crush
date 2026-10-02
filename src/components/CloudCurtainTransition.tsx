"use client";

import Image from "next/image";
import {useCallback, useEffect, useMemo, useRef} from "react";

export const CLOUD_CURTAIN_GROUP_SRC = "/ui_home/clouds_group.png";
export const CLOUD_CURTAIN_GROUP_WIDTH = 1774;
export const CLOUD_CURTAIN_GROUP_HEIGHT = 1920;

export const CLOUD_CURTAIN_STACK_COUNT = 2;

/** Offset verticale tra i PNG sovrapposti (px, dimensione nativa). */
const STACK_OVERLAP_PX = 640;

/** Quanto restano fuori schermo a riposo (entrambi i layer invisibili). */
const HIDE_GAP_VW = 24;

/** Chiusura: quanto entrano da ciascun lato (overlap centrale, niente buco). */
const CLOSED_INSET_VW = 170;
const CLOSED_X_LEFT = `calc(${CLOSED_INSET_VW}vw - 100%)`;
const CLOSED_X_RIGHT = `calc(-${CLOSED_INSET_VW}vw + 100%)`;

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
  const closedX = isLeft ? CLOSED_X_LEFT : CLOSED_X_RIGHT;

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
          ["--cloud-closed-x" as string]: closedX,
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

  phaseRef.current = phase;

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
