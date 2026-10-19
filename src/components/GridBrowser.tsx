"use client";

import {useEffect, useMemo, useRef, useState} from "react";

import {AssetPaths} from "@game/shared/config/asset-paths.const";
import {listAllGrids, type ListedGrid} from "@game/shared/config/grid-generation.const";
import {
  boardPlatePad,
  strokeBoardRim,
  traceBoardPath,
} from "@game/shared/board-plate-paint";
import {plateFillForStage} from "@/settings/stage-scenery-assets";
import {missionForGrid, remainingOf} from "@game/shared/level-mission";
import {obstacleFromSymbol} from "@game/shared/obstacles";
import {getPieceKeysForStageLevel} from "@/settings/level-pieces";

type GridBrowserProps = {
  onClose: () => void;
};

const missionOf = (shape: ListedGrid) => {
  const pieceIcon = getPieceKeysForStageLevel(shape.localLevel, shape.stageIndex)[0] ?? "block";
  const mission = missionForGrid(shape.cells, pieceIcon);
  const obstacles = shape.cells.map((row) =>
    row.map((symbol) => (symbol === "." ? null : obstacleFromSymbol(symbol))),
  );

  return {
    moves: mission.moves,
    goals: mission.goals.map((goal) => ({
      ...goal,
      left: remainingOf(goal.kind, obstacles, mission.collect),
    })),
  };
};

const paintGrid = (
  canvas: HTMLCanvasElement,
  open: boolean[][],
  cols: number,
  rows: number,
  fillColor: string,
): void => {
  const maxW = window.innerWidth * 0.9;
  const maxH = window.innerHeight * 0.52;
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
  ctx.fillStyle = fillColor;
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

    paintGrid(
      canvas,
      open,
      shape.cols,
      shape.rows,
      plateFillForStage(shape.stageIndex + 1),
    );
  }, [shape]);

  if (!shape) return null;

  const mission = missionOf(shape);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#16324f]/90 px-4">
      <p className="font-display text-3xl font-bold tracking-wide text-[#fff8dc]">{shape.id}</p>
      <div className="mb-4 mt-3 flex flex-wrap items-center justify-center gap-3">
        <p className="rounded-full border border-[#e6c471]/70 bg-black/30 px-4 py-1 font-display text-lg font-bold text-[#fff8dc]">
          Mosse {mission.moves}
        </p>
        {mission.goals.map((goal) => (
          <span
            key={goal.kind}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1"
          >
            <img
              alt=""
              className="h-9 w-9 object-contain"
              src={AssetPaths.image(goal.icon)}
            />
            <span className="font-display text-lg font-bold text-[#fff8dc]">{goal.left}</span>
          </span>
        ))}
      </div>
      <canvas ref={canvasRef} className="h-auto max-h-[52vh] w-auto max-w-[90vw]" />
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
