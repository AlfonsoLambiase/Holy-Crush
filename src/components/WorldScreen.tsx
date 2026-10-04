"use client";

import Image from "next/image";
import {useCallback, useEffect, useRef, useState} from "react";

import {ShopMarket} from "@/components/ShopMarket";
import {StageHudBar} from "@/components/StageHudBar";
import {WoodPanel} from "@/components/WoodPanel";
import {useLanguage} from "@/language/LanguageProvider";
import {playClick, playNoTouch, playSwitch} from "@/settings/click";
import {computeStageHudMetrics, type StageHudMetrics} from "@/settings/stage-hud-layout";
import {isWorldUnlocked} from "@/settings/progress";
import {WORLD_COUNT, worldBackgroundPath, worldImagePath} from "@/settings/world-map";

const CLICKABLE_SCROLL_MAX = 0.35;
const NEAR_SCALE_START = 1.18;
const NEAR_WIDTH = "min(98vw, 36rem)";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

type WorldScreenProps = {
  onEnter: (worldIndex: number) => void;
  onBack: () => void;
};

const NEAR_BOTTOM = 36;
const NEAR_BOTTOM_END = 18;
const FAR_BOTTOM_START = 58;
const DISTANT_BOTTOM = 60;
const DISTANT_SCALE = 0.26;
const DISTANT_OPACITY = 0.5;

type WorldLayerStyle = {
  bottom: string;
  scale: number;
  opacity: number;
  zIndex: number;
};

/** u = phase − worldIndex; transizione continua senza scatti a fine segmento. */
function styleForWorldOffset(u: number): WorldLayerStyle | null {
  if (u > 1 || u < -2) return null;

  if (u >= 0) {
    return {
      bottom: `${lerp(NEAR_BOTTOM, NEAR_BOTTOM_END, u)}%`,
      scale: lerp(NEAR_SCALE_START, 1.78, u),
      opacity: lerp(1, 0, u),
      zIndex: 3,
    };
  }

  if (u >= -1) {
    const local = u + 1;

    return {
      bottom: `${lerp(FAR_BOTTOM_START, NEAR_BOTTOM, local)}%`,
      scale: lerp(0.36, NEAR_SCALE_START, local),
      opacity: lerp(0.72, 1, local),
      zIndex: 2,
    };
  }

  const local = u + 2;

  return {
    bottom: `${lerp(DISTANT_BOTTOM, FAR_BOTTOM_START, local)}%`,
    scale: lerp(DISTANT_SCALE, 0.36, local),
    opacity: lerp(DISTANT_OPACITY, 0.72, local),
    zIndex: 1,
  };
}
const LOCKED_BG_OPACITY = 0.68;

const bgOpacityForWorld = (worldIndex: number, fade: number) =>
  fade * (isWorldUnlocked(worldIndex) ? 1 : LOCKED_BG_OPACITY);
const LOCKED_FILTER = "brightness(0.38) saturate(0.55)";
const SWIPE_DISTANCE_PX = 52;
const SWIPE_VELOCITY = 0.28;
const SNAP_MS = 340;
const SHOP_PRESS_MS = 220;
const defaultHudMetrics = (): StageHudMetrics => ({
  headerCenterY: 58,
  heartSize: 62,
  buttonSize: 44,
  insetX: 52,
});

export function WorldScreen({onEnter, onBack}: WorldScreenProps) {
  const {t} = useLanguage();
  const [scrollY, setScrollY] = useState(0);
  const [viewportH, setViewportH] = useState(800);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopPressed, setShopPressed] = useState(false);
  const [hudMetrics, setHudMetrics] = useState<StageHudMetrics>(defaultHudMetrics);
  const scrollRef = useRef(0);
  const lastTouchY = useRef<number | null>(null);
  const gestureStartY = useRef(0);
  const gestureStartTime = useRef(0);
  const snapFrame = useRef<number | null>(null);

  useEffect(() => {
    const sync = () => {
      setViewportH(window.innerHeight);
      setHudMetrics(computeStageHudMetrics(window.innerWidth, window.innerHeight));
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const maxScroll = Math.max(0, (WORLD_COUNT - 1) * viewportH);

  const clampScroll = useCallback(
    (value: number) => Math.min(maxScroll, Math.max(0, value)),
    [maxScroll],
  );

  const setScroll = useCallback(
    (value: number) => {
      const next = clampScroll(value);
      scrollRef.current = next;
      setScrollY(next);
    },
    [clampScroll],
  );

  /** Dito verso il basso (su→giù) = mondo successivo. */
  const applyScrollDelta = useCallback(
    (delta: number) => {
      setScroll(scrollRef.current + delta);
    },
    [setScroll],
  );

  const snapToWorld = useCallback(
    (worldIndex: number) => {
      const h = viewportH || 1;
      const nextWorld = Math.min(WORLD_COUNT - 1, Math.max(0, worldIndex));
      const currentWorld = Math.round(scrollRef.current / h);

      if (nextWorld !== currentWorld) {
        playSwitch();
      }

      const target = nextWorld * h;

      if (snapFrame.current !== null) cancelAnimationFrame(snapFrame.current);

      const from = scrollRef.current;
      const start = performance.now();

      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / SNAP_MS);
        const eased = 1 - (1 - progress) ** 3;

        setScroll(from + (target - from) * eased);

        if (progress < 1) snapFrame.current = requestAnimationFrame(step);
        else snapFrame.current = null;
      };

      snapFrame.current = requestAnimationFrame(step);
    },
    [setScroll, viewportH],
  );

  useEffect(
    () => () => {
      if (snapFrame.current !== null) cancelAnimationFrame(snapFrame.current);
    },
    [],
  );

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (shopOpen) {
        if ((event.target as Element | null)?.closest("[data-shop-scroll]")) {
          return;
        }

        event.preventDefault();

        return;
      }

      event.preventDefault();
      applyScrollDelta(-event.deltaY * 0.85);
    };

    window.addEventListener("wheel", onWheel, {passive: false});
    return () => window.removeEventListener("wheel", onWheel);
  }, [applyScrollDelta, shopOpen]);

  const beginGesture = useCallback((y: number) => {
    if (snapFrame.current !== null) {
      cancelAnimationFrame(snapFrame.current);
      snapFrame.current = null;
    }

    gestureStartY.current = y;
    gestureStartTime.current = performance.now();
    lastTouchY.current = y;
  }, []);

  const finishGesture = useCallback(
    (endY: number) => {
      const h = viewportH || 1;
      const dy = endY - gestureStartY.current;
      const dt = Math.max(1, performance.now() - gestureStartTime.current);
      const velocity = dy / dt;
      const seg = Math.floor(scrollRef.current / h);

      if (dy >= SWIPE_DISTANCE_PX || (dy > 24 && velocity >= SWIPE_VELOCITY)) {
        snapToWorld(seg + 1);

        return;
      }

      if (dy <= -SWIPE_DISTANCE_PX || (dy < -24 && velocity <= -SWIPE_VELOCITY)) {
        snapToWorld(seg - 1);

        return;
      }

      snapToWorld(Math.round(scrollRef.current / h));
    },
    [snapToWorld, viewportH],
  );

  const segment = viewportH || 1;
  const phase = Math.min(Math.max(scrollY / segment, 0), WORLD_COUNT - 1);
  const nearIndex = Math.floor(phase);
  const nearBlend = phase - nearIndex;

  const canEnterNear =
    nearBlend < CLICKABLE_SCROLL_MAX && isWorldUnlocked(nearIndex);

  const bgFrom = Math.floor(phase);
  const bgTo = Math.min(bgFrom + 1, WORLD_COUNT - 1);
  const bgMix = bgTo === bgFrom ? 0 : phase - bgFrom;
  const bgFadeOut = 1 - bgMix;
  const bgFadeIn = bgMix;

  const visibleWorldFrom = Math.max(0, nearIndex - 1);
  const visibleWorldTo = Math.min(WORLD_COUNT - 1, nearIndex + 2);

  const handleNearWorldClick = () => {
    if (!isWorldUnlocked(nearIndex)) {
      playNoTouch();
      return;
    }

    if (!canEnterNear) return;

    playClick();
    onEnter(nearIndex);
  };

  const worldLayer = (
    index: number,
    style: {
      bottom: string;
      scale: number;
      opacity: number;
      zIndex: number;
      clickable?: boolean;
      width?: string;
      locked?: boolean;
    },
  ) => {
    if (index < 0 || index >= WORLD_COUNT) return null;

    const locked = style.locked ?? !isWorldUnlocked(index);

    return (
      <button
        key={index}
        type="button"
        aria-label={style.clickable ? "Entra nel mondo" : undefined}
        aria-disabled={locked && !style.clickable}
        className="absolute left-1/2 max-w-none border-0 bg-transparent p-0 transition-none focus:outline-none"
        style={{
          width: style.width ?? "min(92vw, 28rem)",
          bottom: style.bottom,
          transform: `translate(-50%, 50%) scale(${style.scale})`,
          opacity: locked ? style.opacity * 0.72 : style.opacity,
          zIndex: style.zIndex,
          cursor: style.clickable ? "pointer" : "default",
          pointerEvents: style.clickable ? "auto" : "none",
        }}
        onClick={style.clickable ? handleNearWorldClick : undefined}
      >
        <Image
          alt=""
          className="h-auto w-full select-none"
          draggable={false}
          height={1024}
          priority={index <= 1}
          src={worldImagePath(index)}
          style={{filter: locked ? LOCKED_FILTER : undefined}}
          width={1024}
        />
      </button>
    );
  };

  return (
    <div
      className={`relative h-dvh w-full select-none overflow-hidden bg-[#0d0d0f] ${shopOpen ? "touch-auto" : "touch-none"}`}
      onPointerCancel={() => {
        if (shopOpen) return;

        lastTouchY.current = null;
      }}
      onPointerDown={(event) => {
        if (shopOpen || event.button !== 0) return;

        beginGesture(event.clientY);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (shopOpen || lastTouchY.current === null) return;

        applyScrollDelta(event.clientY - lastTouchY.current);
        lastTouchY.current = event.clientY;
      }}
      onPointerUp={(event) => {
        if (shopOpen) return;

        if (lastTouchY.current !== null) finishGesture(event.clientY);

        lastTouchY.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <Image
          alt=""
          className="object-cover object-center select-none"
          draggable={false}
          fill
          priority
          sizes="100vw"
          src={worldBackgroundPath(bgFrom)}
          style={{opacity: bgOpacityForWorld(bgFrom, bgFadeOut)}}
        />
        {bgTo !== bgFrom && (
          <Image
            alt=""
            className="object-cover object-center select-none"
            draggable={false}
            fill
            priority={bgTo <= 1}
            sizes="100vw"
            src={worldBackgroundPath(bgTo)}
            style={{opacity: bgOpacityForWorld(bgTo, bgFadeIn)}}
          />
        )}
      </div>

      {Array.from({length: visibleWorldTo - visibleWorldFrom + 1}, (_, i) => {
        const worldIndex = visibleWorldFrom + i;
        const offset = phase - worldIndex;
        const layerStyle = styleForWorldOffset(offset);

        if (!layerStyle) return null;

        const isNear = worldIndex === nearIndex;

        return worldLayer(worldIndex, {
          ...layerStyle,
          width: layerStyle.zIndex >= 2 ? NEAR_WIDTH : undefined,
          clickable: isNear,
        });
      })}

      <StageHudBar onExit={onBack} />

      <button
        aria-label={t("shop")}
        className="pointer-events-auto absolute z-40 block shrink-0 border-0 bg-transparent p-0 transition-transform duration-100"
        style={{
          left: hudMetrics.insetX,
          top: hudMetrics.headerCenterY,
          width: hudMetrics.buttonSize,
          height: hudMetrics.buttonSize,
          transform: `translateY(-50%) ${shopPressed ? "scale(0.92)" : "scale(1)"}`,
        }}
        type="button"
        onClick={() => {
          if (shopOpen) return;

          playClick();
          setShopPressed(true);
          window.setTimeout(() => {
            setShopPressed(false);
            setShopOpen(true);
          }, SHOP_PRESS_MS);
        }}
      >
        <Image
          alt=""
          className="object-contain drop-shadow-lg"
          draggable={false}
          fill
          sizes="4rem"
          src="/ui_home/shop.png"
        />
      </button>

      {shopOpen ? (
        <WoodPanel
          alt={t("shop")}
          className="fixed inset-0 z-50"
          contentAlign="start"
          onClose={() => setShopOpen(false)}
        >
          <ShopMarket />
        </WoodPanel>
      ) : null}
    </div>
  );
}
