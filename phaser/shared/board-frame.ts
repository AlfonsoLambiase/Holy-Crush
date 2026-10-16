import * as Phaser from "phaser";

import {boardPlatePad, PLATE_FILL, strokeBoardRim, traceBoardPath} from "./board-plate-paint";

const FILL_KEY = "board-plate-fill";
const RIM_KEY = "board-plate-rim";
const MAX_TEXTURE = 4096;

type PlateDraw = {
  canvas: HTMLCanvasElement;
  pad: number;
  width: number;
  height: number;
};

const paintPlate = (
  open: readonly (readonly boolean[])[],
  cell: number,
  gridLeft: number,
  gridTop: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): PlateDraw | null => {
  const cols = open.reduce((max, row) => Math.max(max, row.length), 0);
  const rows = open.length;
  const hasOpen = open.some((row) => row.some(Boolean));

  if (cols === 0 || rows === 0 || !hasOpen || typeof document === "undefined") return null;

  const pad = boardPlatePad(cell);
  const width = cols * cell + pad * 2;
  const height = rows * cell + pad * 2;
  const longest = Math.max(width, height);
  const resolution = longest > MAX_TEXTURE ? MAX_TEXTURE / longest : 1;
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(width * resolution));
  canvas.height = Math.max(1, Math.round(height * resolution));

  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  ctx.setTransform(resolution, 0, 0, resolution, (pad - gridLeft) * resolution, (pad - gridTop) * resolution);
  traceBoardPath(ctx, open, cell, gridLeft, gridTop);
  paint(ctx);

  return {canvas, pad, width, height};
};

const placeLayer = (
  scene: Phaser.Scene,
  key: string,
  plate: PlateDraw,
  gridLeft: number,
  gridTop: number,
): Phaser.GameObjects.Image => {
  if (scene.textures.exists(key)) scene.textures.remove(key);

  scene.textures.addCanvas(key, plate.canvas);

  return scene.add
    .image(gridLeft - plate.pad, gridTop - plate.pad, key)
    .setOrigin(0, 0)
    .setDisplaySize(plate.width, plate.height);
};

export type BoardPlate = {
  fill: Phaser.GameObjects.Image;
  rim: Phaser.GameObjects.Image;
};

//* Fondo sotto i block, cornice dorata sopra. Stessa forma, così il bordo resta allineato.
export function createBoardPlate(
  scene: Phaser.Scene,
  open: readonly (readonly boolean[])[],
  cell: number,
  gridLeft: number,
  gridTop: number,
): BoardPlate | null {
  const fill = paintPlate(open, cell, gridLeft, gridTop, (ctx) => {
    ctx.fillStyle = PLATE_FILL;
    ctx.fill("evenodd");
  });
  const rim = paintPlate(open, cell, gridLeft, gridTop, (ctx) => {
    strokeBoardRim(ctx, cell);
  });

  if (!fill || !rim) return null;

  return {
    fill: placeLayer(scene, FILL_KEY, fill, gridLeft, gridTop),
    rim: placeLayer(scene, RIM_KEY, rim, gridLeft, gridTop),
  };
}

export function destroyBoardPlate(scene: Phaser.Scene, plate: BoardPlate | null): void {
  if (plate?.fill.active) plate.fill.destroy();
  if (plate?.rim.active) plate.rim.destroy();
  if (scene.textures.exists(FILL_KEY)) scene.textures.remove(FILL_KEY);
  if (scene.textures.exists(RIM_KEY)) scene.textures.remove(RIM_KEY);
}
