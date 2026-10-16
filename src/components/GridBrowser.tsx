"use client";

import {useEffect, useMemo, useRef, useState} from "react";

import {listAllGrids} from "@game/shared/config/grid-generation.const";
import {
  boardPlatePad,
  PLATE_FILL,
  strokeBoardRim,
  traceBoardPath,
} from "@game/shared/board-plate-paint";

type GridBrowserProps = {
  onClose: () => void;
};

const paintGrid = (
  canvas: HTMLCanvasElement,
  open: boolean[][],
  cols: number,
  rows: number,
): void => {
  const maxW = window.innerWidth * 0.9;
  const maxH = window.innerHeight * 0.62;
  const cell = Math.max(24, Math.floor(Math.min(maxW / cols, maxH / rows)));
  const pad = boardPlatePad(cell);
  const width = Math.ceil(cols * cell + pad * 2);
  const height = Math.ceil(rows * cell + pad * 2);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  ctx.setTransform(1, 0, 0, 1, pad, pad);
  traceBoardPath(ctx, open, cell, 0, 0);
  ctx.fillStyle = PLATE_FILL;
  ctx.fill("evenodd");
  strokeBoardRim(ctx, cell);
};

export function GridBrowser({onClose}: GridBrowserProps) {
  const grids = useMemo(() => listAllGrids(), []);
  const [index, setIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shape = grids[index];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => (current + 1) % grids.length);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => (current - 1 + grids.length) % grids.length);
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [grids.length, onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !shape) return;

    const open = shape.cells.map((row) => row.map((symbol) => symbol !== "."));

    paintGrid(canvas, open, shape.cols, shape.rows);
  }, [shape]);

  if (!shape) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#16324f]/90 px-4">
      <p className="mb-4 font-display text-3xl font-bold tracking-wide text-[#fff8dc]">{shape.id}</p>
      <canvas ref={canvasRef} className="h-auto max-h-[62vh] w-auto max-w-[90vw]" />
      <p className="mt-4 font-display text-sm text-[#fff8dc]/80">
        {index + 1} / {grids.length} · frecce ← → · Esc chiude
      </p>
      <button
        className="mt-3 rounded-lg border border-amber-500 bg-[#5c3a14] px-4 py-2 font-display text-sm font-bold text-[#fff8dc]"
        type="button"
        onClick={onClose}
      >
        Chiudi
      </button>
    </div>
  );
}
