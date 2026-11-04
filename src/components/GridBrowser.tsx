"use client";

import {useEffect, useMemo, useRef, useState} from "react";

import {AssetPaths} from "@game/shared/config/asset-paths.const";
import {
  getLevelsInStage,
  listAllGrids,
  type ListedGrid,
} from "@game/shared/config/grid-generation.const";
import {
  boardPlatePad,
  strokeBoardRim,
  traceBoardPath,
} from "@game/shared/board-plate-paint";
import {displayKeyForSymbol} from "@game/shared/grid-cell-display";
import {plateFillForStage} from "@/settings/stage-scenery-assets";
import {
  goalKindForObstacleSymbol,
  hasFixedObjectivePosition,
  isSpecialObjectiveSymbol,
  missionForGrid,
  remainingOf,
  type GoalKind,
  type MissionGoal,
} from "@game/shared/level-mission";
import {obstacleFromSymbol} from "@game/shared/obstacles";
import {getPieceKeysForStageLevel} from "@/settings/level-pieces";

type GridBrowserProps = {
  onClose: () => void;
};

type MissionView = {
  moves: number;
  goals: {kind: GoalKind; icon: string; left: number}[];
  activeGoalKinds: Set<GoalKind>;
};

const missionOf = (shape: ListedGrid): MissionView => {
  const pieceIcon = getPieceKeysForStageLevel(shape.localLevel, shape.stageIndex)[0] ?? "block";
  const mission = missionForGrid(shape.cells, pieceIcon, {
    stageIndex: shape.stageIndex,
    localLevel: shape.localLevel,
    levelsInStage: getLevelsInStage(shape.stageIndex),
  });
  const obstacles = shape.cells.map((row) =>
    row.map((symbol) => (symbol === "." ? null : obstacleFromSymbol(symbol))),
  );

  return {
    moves: mission.moves,
    goals: mission.goals.map((goal) => ({
      ...goal,
      left: remainingOf(goal.kind, obstacles, mission.collect),
    })),
    activeGoalKinds: new Set(mission.goals.map((goal) => goal.kind)),
  };
};

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

const loadImage = (key: string): Promise<HTMLImageElement | null> => {
  const cached = imageCache.get(key);

  if (cached) return cached;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = AssetPaths.image(key);
  });

  imageCache.set(key, promise);

  return promise;
};

type ObjectiveMarker = {
  special: boolean;
  icon: string;
};

const markerForCell = (
  symbol: string,
  activeGoalKinds: Set<GoalKind>,
  goals: MissionGoal[],
): ObjectiveMarker | null => {
  if (symbol === "." || symbol === "0") return null;

  const kind = goalKindForObstacleSymbol(symbol as ListedGrid["cells"][number][number]);

  if (!kind || !hasFixedObjectivePosition(kind) || !activeGoalKinds.has(kind)) return null;

  const icon = goals.find((goal) => goal.kind === kind)?.icon ?? symbol;
  const special = isSpecialObjectiveSymbol(symbol as ListedGrid["cells"][number][number]);

  return {special, icon};
};

const paintGrid = async (
  canvas: HTMLCanvasElement,
  shape: ListedGrid,
  fillColor: string,
  mission: MissionView,
): Promise<void> => {
  const {cells, cols, rows} = shape;
  const open = cells.map((row) => row.map((symbol) => symbol !== "."));
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

  const keys = new Set<string>();

  for (const row of cells) {
    for (const symbol of row) {
      const key = displayKeyForSymbol(symbol);

      if (key) keys.add(key);

      const marker = markerForCell(symbol, mission.activeGoalKinds, mission.goals);

      if (marker) keys.add(marker.icon);
    }
  }

  const images = new Map<string, HTMLImageElement>();

  await Promise.all(
    [...keys].map(async (key) => {
      const img = await loadImage(key);

      if (img) images.set(key, img);
    }),
  );

  const inset = cell * 0.08;
  const iconSize = cell - inset * 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const symbol = cells[row][col];

      if (symbol === ".") continue;

      const x = col * cell;
      const y = row * cell;
      const marker = markerForCell(symbol, mission.activeGoalKinds, mission.goals);

      if (marker) {
        ctx.save();
        ctx.strokeStyle = marker.special ? "#ffd54a" : "#7cffb2";
        ctx.lineWidth = Math.max(2, cell * 0.08);
        ctx.strokeRect(x + inset * 0.35, y + inset * 0.35, cell - inset * 0.7, cell - inset * 0.7);
        ctx.restore();

        const badge = images.get(marker.icon);

        if (badge) {
          const badgeSize = cell * 0.34;

          ctx.drawImage(badge, x + cell - badgeSize - 2, y + 2, badgeSize, badgeSize);
        }
      }

      const key = displayKeyForSymbol(symbol);

      if (!key) continue;

      const img = images.get(key);

      if (img) {
        ctx.drawImage(img, x + inset, y + inset, iconSize, iconSize);
        continue;
      }

      if (symbol !== "0") {
        ctx.fillStyle = "#fff8dc";
        ctx.font = `bold ${Math.floor(cell * 0.42)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(symbol, x + cell / 2, y + cell / 2);
      }
    }
  }
};

export function GridBrowser({onClose}: GridBrowserProps) {
  const grids = useMemo(() => listAllGrids(), []);
  const [index, setIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shape = grids[index];
  const mission = useMemo(() => (shape ? missionOf(shape) : null), [shape]);

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

    if (!canvas || !shape || !mission) return;

    let cancelled = false;

    void paintGrid(canvas, shape, plateFillForStage(shape.stageIndex + 1), mission).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [shape, mission]);

  if (!shape || !mission) return null;

  const hasFixedObjectiveMarkers = shape.cells.some((row) =>
    row.some((symbol) => markerForCell(symbol, mission.activeGoalKinds, mission.goals)),
  );

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
      {hasFixedObjectiveMarkers ? (
        <p className="mt-2 max-w-md text-center font-display text-xs text-[#fff8dc]/75">
          Bordo verde: obiettivo a posizione fissa · bordo dorato: obiettivo speciale (H, J, C, D, L,
          R, V, X, Z). Icona in alto a destra = tipo obiettivo attivo.
        </p>
      ) : null}
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
