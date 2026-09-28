"use client";

import {useEffect, useRef} from "react";

const ORB_COUNT = 12;

type Orb = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  sway: number;
  phase: number;
  alpha: number;
};

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

export function HomeLightFall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = context;
    let width = 0;
    let height = 0;
    let drift = 0;
    let mouseDrift = 0;
    let mouseAt = 0;
    let tiltDrift = 0;
    let usingTilt = false;
    let frame = 0;

    const orbs: Orb[] = Array.from({length: ORB_COUNT}, () => ({
      x: 0,
      y: 0,
      radius: 2,
      speed: 50,
      sway: 12,
      phase: 0,
      alpha: 0.5,
    }));

    const place = (orb: Orb, fromTop: boolean) => {
      orb.x = Math.random() * width;
      orb.y = fromTop ? -12 - Math.random() * 40 : Math.random() * height;
      orb.radius = 1.4 + Math.random() * 2.2;
      orb.speed = 34 + Math.random() * 42;
      orb.sway = 10 + Math.random() * 18;
      orb.phase = Math.random() * Math.PI * 2;
      orb.alpha = 0.3 + Math.random() * 0.28;
    };

    const resize = () => {
      const parent = canvas.parentElement;

      if (!parent) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();
    orbs.forEach((orb) => place(orb, false));

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      mouseDrift = clamp(event.movementX / 14);
      mouseAt = performance.now();
    };

    const onTilt = (event: DeviceOrientationEvent) => {
      if (event.gamma == null) return;

      usingTilt = true;
      tiltDrift = clamp(event.gamma / 26);
    };

    let tiltListening = false;

    const listenTilt = () => {
      if (tiltListening) return;

      tiltListening = true;
      window.addEventListener("deviceorientation", onTilt);
    };

    const askTilt = () => {
      const orientation = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };

      if (typeof orientation.requestPermission !== "function") return;

      void orientation
        .requestPermission()
        .then((state) => {
          if (state === "granted") listenTilt();
        })
        .catch(() => {});
    };

    if (typeof DeviceOrientationEvent !== "undefined") {
      const orientation = DeviceOrientationEvent as unknown as {requestPermission?: () => Promise<string>};

      if (typeof orientation.requestPermission !== "function") listenTilt();
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", askTilt, {once: true});
    window.addEventListener("resize", resize);

    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);

      last = now;

      const mouseFresh = now - mouseAt < 450;

      if (!mouseFresh) mouseDrift *= Math.exp(-dt * 1.6);

      const goal = mouseFresh || !usingTilt ? mouseDrift : tiltDrift;

      drift += (goal - drift) * Math.min(1, dt * 4);
      ctx.clearRect(0, 0, width, height);

      for (const orb of orbs) {
        orb.y += orb.speed * dt;
        orb.x += drift * 90 * dt + Math.sin(now / 800 + orb.phase) * orb.sway * dt;

        if (orb.y > height + 16) place(orb, true);
        if (orb.x < -24) orb.x = width + 12;
        if (orb.x > width + 24) orb.x = -12;

        const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius * 6);

        glow.addColorStop(0, `rgba(255, 255, 255, ${orb.alpha})`);
        glow.addColorStop(0.35, `rgba(255, 255, 255, ${orb.alpha * 0.55})`);
        glow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("deviceorientation", onTilt);
      window.removeEventListener("pointerdown", askTilt);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-0" />;
}
