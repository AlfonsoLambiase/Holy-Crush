"use client";

import Image from "next/image";
import {useEffect, useLayoutEffect, useRef, useState} from "react";

const CLOUD_ASSETS = [
  {src: "/ui_home/cloud_0.png", width: 640, height: 400, maxVw: 0.36, maxRem: 9.5},
  {src: "/ui_home/cloud_1.png", width: 600, height: 380, maxVw: 0.34, maxRem: 9},
  {src: "/ui_home/cloud_2.png", width: 680, height: 420, maxVw: 0.4, maxRem: 11},
] as const;

const CLOUD_COUNT = 5;
const SIZE_MIN_SCALE = 0.48;
const SIZE_MAX_SCALE = 1;
const SPEED_MIN = 6;
const SPEED_MAX = 18;
const SWAY_PX = 7;
const OFFSCREEN_PAD = 48;
const CLOUD_BAND_SCREEN_FRACTION = 0.42;
const BOUNCE_RESTITUTION = 0.88;

const cloudBandHeight = (viewportH: number) => viewportH * CLOUD_BAND_SCREEN_FRACTION;

type DriftCloud = {
  uid: number;
  assetIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  sizePx: number;
  mirrored: boolean;
  swayPhase: number;
};

type HomeDriftingCloudsProps = {
  visible: boolean;
  paused: boolean;
};

const readRootFontPx = () =>
  parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

const cloudSizePx = (viewportW: number, assetIndex: number): number => {
  const asset = CLOUD_ASSETS[assetIndex];
  const scale = SIZE_MIN_SCALE + Math.random() * (SIZE_MAX_SCALE - SIZE_MIN_SCALE);
  const root = readRootFontPx();

  return Math.min(viewportW * asset.maxVw * scale, asset.maxRem * root * scale);
};

const randomVelocity = (): {vx: number; vy: number} => {
  const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
  const angle = Math.random() * Math.PI * 2;

  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
};

const spawnCloud = (
  viewportW: number,
  viewportH: number,
  uid: number,
  mode: "inside" | "edge",
): DriftCloud => {
  const assetIndex = Math.floor(Math.random() * CLOUD_ASSETS.length);
  const sizePx = cloudSizePx(viewportW, assetIndex);
  const half = sizePx * 0.5;
  const bandH = cloudBandHeight(viewportH);
  const ySpan = Math.max(1, bandH - sizePx);
  const vel = randomVelocity();
  let x = 0;
  let y = 0;

  if (mode === "inside") {
    x = half + Math.random() * Math.max(1, viewportW - sizePx);
    y = half + Math.random() * ySpan;
  } else {
    const edge = Math.floor(Math.random() * 3);

    switch (edge) {
      case 0:
        x = -half - OFFSCREEN_PAD;
        y = half + Math.random() * ySpan;
        break;
      case 1:
        x = viewportW + half + OFFSCREEN_PAD;
        y = half + Math.random() * ySpan;
        break;
      default:
        x = half + Math.random() * Math.max(1, viewportW - sizePx);
        y = -half - OFFSCREEN_PAD;
        break;
    }

    const toCenterX = viewportW * 0.5 - x;
    const toCenterY = bandH * 0.5 - y;
    const len = Math.hypot(toCenterX, toCenterY) || 1;
    const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);

    vel.vx = (toCenterX / len) * speed * 0.75 + (Math.random() - 0.5) * 6;
    vel.vy = (toCenterY / len) * speed * 0.75 + (Math.random() - 0.5) * 6;
  }

  return {
    uid,
    assetIndex,
    x,
    y,
    vx: vel.vx,
    vy: vel.vy,
    sizePx,
    mirrored: Math.random() > 0.5,
    swayPhase: Math.random() * Math.PI * 2,
  };
};

const isOutsideHorizontally = (cloud: DriftCloud, w: number): boolean => {
  const half = cloud.sizePx * 0.5;

  return cloud.x < -half - OFFSCREEN_PAD || cloud.x > w + half + OFFSCREEN_PAD;
};

const bounceVertical = (cloud: DriftCloud, viewportH: number): DriftCloud => {
  const half = cloud.sizePx * 0.5;
  const bandH = cloudBandHeight(viewportH);
  const yMin = half;
  const yMax = Math.max(yMin, bandH - half);
  let {y, vy} = cloud;

  if (y < yMin) {
    y = yMin;
    vy = Math.abs(vy) * BOUNCE_RESTITUTION;
  } else if (y > yMax) {
    y = yMax;
    vy = -Math.abs(vy) * BOUNCE_RESTITUTION;
  }

  return {...cloud, y, vy};
};

const initialClouds = (w: number, h: number): DriftCloud[] =>
  Array.from({length: CLOUD_COUNT}, (_, index) => spawnCloud(w, h, index + 1, "inside"));

export function HomeDriftingClouds({visible, paused}: HomeDriftingCloudsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const uidRef = useRef(CLOUD_COUNT + 1);
  const pausedRef = useRef(paused);
  const [clouds, setClouds] = useState<DriftCloud[]>([]);

  pausedRef.current = paused;

  useLayoutEffect(() => {
    const root = rootRef.current?.parentElement;

    if (!root || root.clientWidth <= 0) return;

    setClouds(initialClouds(root.clientWidth, root.clientHeight));
  }, []);

  useEffect(() => {
    const root = rootRef.current?.parentElement;

    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setClouds(initialClouds(root.clientWidth, root.clientHeight));

      return;
    }

    let frame = 0;
    let last = performance.now();

    const ensureClouds = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;

      setClouds((prev) => (prev.length ? prev : initialClouds(w, h)));
    };

    ensureClouds();

    const tick = (now: number) => {
      const w = root.clientWidth;
      const h = root.clientHeight;

      if (!pausedRef.current && w > 0 && h > 0) {
        const dt = Math.min(0.05, (now - last) / 1000);

        last = now;

        setClouds((prev) => {
          if (!prev.length) return initialClouds(w, h);

          return prev.map((cloud) => {
            if (isOutsideHorizontally(cloud, w)) {
              const nextUid = uidRef.current++;

              return spawnCloud(w, h, nextUid, "edge");
            }

            const sway = Math.sin(now / 2200 + cloud.swayPhase) * SWAY_PX;

            return bounceVertical(
              {
                ...cloud,
                x: cloud.x + cloud.vx * dt + sway * dt,
                y: cloud.y + cloud.vy * dt,
              },
              h,
            );
          });
        });
      } else {
        last = now;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    const onResize = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;

      setClouds((prev) =>
        prev.map((cloud) =>
          isOutsideHorizontally(cloud, w)
            ? spawnCloud(w, h, uidRef.current++, "inside")
            : bounceVertical(cloud, h),
        ),
      );
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 z-6 overflow-hidden transition-opacity duration-700 ${
        visible ? "opacity-90" : "opacity-0"
      }`}
      style={{height: `${CLOUD_BAND_SCREEN_FRACTION * 100}%`}}
    >
      {clouds.map((cloud) => {
        const asset = CLOUD_ASSETS[cloud.assetIndex];

        return (
          <div
            key={cloud.uid}
            className="absolute will-change-transform"
            style={{
              width: cloud.sizePx,
              left: cloud.x,
              top: cloud.y,
              transform: `translate(-50%, -50%) ${cloud.mirrored ? "scaleX(-1)" : ""}`,
            }}
          >
            <Image
              alt=""
              className="h-auto w-full drop-shadow-lg"
              draggable={false}
              height={asset.height}
              src={asset.src}
              width={asset.width}
            />
          </div>
        );
      })}
    </div>
  );
}
