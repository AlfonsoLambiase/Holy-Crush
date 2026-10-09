"use client";

import Image from "next/image";
import {useEffect, useLayoutEffect, useRef, useState} from "react";

const CLOUD_ASSETS = [
  {src: "/images/ui_home/cloud_0.png", width: 640, height: 400, maxVw: 0.36, maxRem: 9.5},
  {src: "/images/ui_home/cloud_1.png", width: 600, height: 380, maxVw: 0.34, maxRem: 9},
  {src: "/images/ui_home/cloud_2.png", width: 680, height: 420, maxVw: 0.4, maxRem: 11},
] as const;

const CLOUD_COUNT = 4;
const CLOUD_BAND_SCREEN_FRACTION = 0.42;

type CloudPoint = readonly [number, number];
type CloudPath = readonly CloudPoint[];

/** Coordinate normalizzate [0–1]. Primo punto = spawn iniziale (sinistra o destra, fuori dal logo). */
const CLOUD_PATHS: readonly CloudPath[] = [
  [
    [0.06, 0.34],
    [0.1, 0.52],
    [0.2, 0.6],
    [0.16, 0.4],
    [0.08, 0.22],
    [0.04, 0.46],
  ],
  [
    [0.94, 0.38],
    [0.9, 0.56],
    [0.8, 0.62],
    [0.84, 0.36],
    [0.92, 0.2],
    [0.96, 0.48],
  ],
  [
    [0.08, 0.58],
    [0.14, 0.44],
    [0.22, 0.28],
    [0.12, 0.18],
    [0.05, 0.32],
  ],
  [
    [0.92, 0.24],
    [0.86, 0.42],
    [0.78, 0.58],
    [0.88, 0.64],
    [0.95, 0.46],
  ],
] as const;

const CLOUD_DEFS = [
  {pathIndex: 0, assetIndex: 0, loopSec: 72, phase: 0, sizeScale: 0.92, mirrored: false},
  {pathIndex: 1, assetIndex: 1, loopSec: 88, phase: 0, sizeScale: 0.78, mirrored: true},
  {pathIndex: 2, assetIndex: 2, loopSec: 96, phase: 0.06, sizeScale: 0.86, mirrored: false},
  {pathIndex: 3, assetIndex: 0, loopSec: 80, phase: 0.04, sizeScale: 0.68, mirrored: true},
] as const;

type PathCloud = {
  uid: number;
  pathIndex: number;
  assetIndex: number;
  loopSec: number;
  phase: number;
  sizePx: number;
  mirrored: boolean;
};

type HomeDriftingCloudsProps = {
  visible: boolean;
  paused: boolean;
};

const cloudBandHeight = (viewportH: number) => viewportH * CLOUD_BAND_SCREEN_FRACTION;

const readRootFontPx = () =>
  parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

const cloudSizePx = (viewportW: number, assetIndex: number, scale: number): number => {
  const asset = CLOUD_ASSETS[assetIndex];
  const root = readRootFontPx();

  return Math.min(viewportW * asset.maxVw * scale, asset.maxRem * root * scale);
};

const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
  const t2 = t * t;
  const t3 = t2 * t;

  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
};

const sampleClosedPath = (pathIndex: number, u: number): {nx: number; ny: number} => {
  const points = CLOUD_PATHS[pathIndex % CLOUD_PATHS.length];
  const n = points.length;
  const wrapped = ((u % 1) + 1) % 1;
  const f = wrapped * n;
  const i = Math.floor(f) % n;
  const t = f - Math.floor(f);

  const at = (index: number) => points[(index + n) % n];

  const p0 = at(i - 1);
  const p1 = at(i);
  const p2 = at(i + 1);
  const p3 = at(i + 2);

  return {
    nx: catmullRom(p0[0], p1[0], p2[0], p3[0], t),
    ny: catmullRom(p0[1], p1[1], p2[1], p3[1], t),
  };
};

const buildClouds = (viewportW: number): PathCloud[] =>
  CLOUD_DEFS.map((def, index) => ({
    uid: index + 1,
    pathIndex: def.pathIndex,
    assetIndex: def.assetIndex,
    loopSec: def.loopSec,
    phase: def.phase,
    sizePx: cloudSizePx(viewportW, def.assetIndex, def.sizeScale),
    mirrored: def.mirrored,
  }));

const pathPosition = (
  cloud: PathCloud,
  viewportW: number,
  viewportH: number,
  elapsedSec: number,
): {x: number; y: number} => {
  const bandH = cloudBandHeight(viewportH);
  const u = cloud.phase + elapsedSec / cloud.loopSec;
  const {nx, ny} = sampleClosedPath(cloud.pathIndex, u);

  return {
    x: nx * viewportW,
    y: ny * bandH,
  };
};

const applyCloudTransform = (
  el: HTMLDivElement,
  x: number,
  y: number,
  cloud: PathCloud,
) => {
  const mirror = cloud.mirrored ? " scaleX(-1)" : "";

  el.style.width = `${cloud.sizePx}px`;
  el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)${mirror}`;
};

export function HomeDriftingClouds({visible, paused}: HomeDriftingCloudsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const cloudsRef = useRef<PathCloud[]>([]);
  const nodeRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const startMsRef = useRef(0);
  const pauseOffsetMsRef = useRef(0);
  const pauseStartedMsRef = useRef<number | null>(null);
  const [clouds, setClouds] = useState<PathCloud[]>([]);

  pausedRef.current = paused;

  useEffect(() => {
    if (paused) {
      if (pauseStartedMsRef.current === null) {
        pauseStartedMsRef.current = performance.now();
      }

      return;
    }

    if (pauseStartedMsRef.current !== null) {
      pauseOffsetMsRef.current += performance.now() - pauseStartedMsRef.current;
      pauseStartedMsRef.current = null;
    }
  }, [paused]);

  useLayoutEffect(() => {
    const root = rootRef.current?.parentElement;

    if (!root || root.clientWidth <= 0) return;

    const w = root.clientWidth;
    const h = root.clientHeight;

    cloudsRef.current = buildClouds(w);
    startMsRef.current = performance.now();
    setClouds(cloudsRef.current);

    requestAnimationFrame(() => {
      for (const cloud of cloudsRef.current) {
        const el = nodeRefs.current.get(cloud.uid);

        if (!el) continue;

        const {x, y} = pathPosition(cloud, w, h, 0);

        applyCloudTransform(el, x, y, cloud);
      }
    });
  }, []);

  useEffect(() => {
    const root = rootRef.current?.parentElement;

    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      cloudsRef.current = buildClouds(root.clientWidth);
      setClouds(cloudsRef.current);

      const w = root.clientWidth;
      const h = root.clientHeight;

      for (const cloud of cloudsRef.current) {
        const el = nodeRefs.current.get(cloud.uid);

        if (!el) continue;

        const {x, y} = pathPosition(cloud, w, h, 0);

        applyCloudTransform(el, x, y, cloud);
      }

      return;
    }

    let frame = 0;

    const tick = (now: number) => {
      const w = root.clientWidth;
      const h = root.clientHeight;

      if (w > 0 && h > 0 && cloudsRef.current.length) {
        const pauseLive =
          pauseStartedMsRef.current !== null ? now - pauseStartedMsRef.current : 0;
        const elapsedSec = (now - startMsRef.current - pauseOffsetMsRef.current - pauseLive) / 1000;

        if (!pausedRef.current) {
          for (const cloud of cloudsRef.current) {
            const el = nodeRefs.current.get(cloud.uid);

            if (!el) continue;

            const {x, y} = pathPosition(cloud, w, h, elapsedSec);

            applyCloudTransform(el, x, y, cloud);
          }
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    const onResize = () => {
      const w = root.clientWidth;

      cloudsRef.current = buildClouds(w);
      setClouds([...cloudsRef.current]);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current?.parentElement;

    if (!root) return;

    const w = root.clientWidth;
    const h = root.clientHeight;
    const pauseLive =
      pauseStartedMsRef.current !== null ? performance.now() - pauseStartedMsRef.current : 0;
    const elapsedSec =
      (performance.now() - startMsRef.current - pauseOffsetMsRef.current - pauseLive) / 1000;

    for (const cloud of cloudsRef.current) {
      const el = nodeRefs.current.get(cloud.uid);

      if (!el) continue;

      const {x, y} = pathPosition(cloud, w, h, elapsedSec);

      applyCloudTransform(el, x, y, cloud);
    }
  }, [clouds]);

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
            ref={(el) => {
              if (el) nodeRefs.current.set(cloud.uid, el);
              else nodeRefs.current.delete(cloud.uid);
            }}
            className="absolute left-0 top-0 will-change-transform"
            style={{width: cloud.sizePx}}
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
