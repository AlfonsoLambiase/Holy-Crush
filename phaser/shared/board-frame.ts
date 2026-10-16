import * as Phaser from "phaser";

import {boardContours, type BoardFillet} from "./board-outline";

const FILL_KEY = "board-plate-fill";
const RIM_KEY = "board-plate-rim";
const FILL = "#94a8d9";
const RIM = "#b39658";
const GOLD = "#a4874e";
const SHINE = "#f4e4bf";
const RIM_RATIO = 0.1;
const GOLD_RATIO = 0.062;
const SHINE_RATIO = 0.024;
const MAX_TEXTURE = 4096;

const drawContour = (ctx: CanvasRenderingContext2D, fillets: readonly BoardFillet[]): void => {
  const first = fillets[0];

  ctx.moveTo(first.start.x, first.start.y);

  for (const fillet of fillets) {
    ctx.lineTo(fillet.start.x, fillet.start.y);

    if (fillet.radius <= 0.5) {
      ctx.lineTo(fillet.end.x, fillet.end.y);
      continue;
    }

    const startAngle = Math.atan2(fillet.start.y - fillet.center.y, fillet.start.x - fillet.center.x);
    const endAngle = Math.atan2(fillet.end.y - fillet.center.y, fillet.end.x - fillet.center.x);

    ctx.arc(fillet.center.x, fillet.center.y, fillet.radius, startAngle, endAngle, fillet.anticlockwise);
  }

  ctx.closePath();
};

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
  const contours = boardContours(open, cell, gridLeft, gridTop);

  if (cols === 0 || rows === 0 || contours.length === 0 || typeof document === "undefined") return null;

  const rim = cell * RIM_RATIO;
  const pad = Math.ceil(rim / 2 + 4);
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
  ctx.beginPath();

  for (const fillets of contours) drawContour(ctx, fillets);

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
    ctx.fillStyle = FILL;
    ctx.fill("evenodd");
  });
  const rim = paintPlate(open, cell, gridLeft, gridTop, (ctx) => {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = RIM;
    ctx.lineWidth = cell * RIM_RATIO;
    ctx.stroke();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = cell * GOLD_RATIO;
    ctx.stroke();
    ctx.strokeStyle = SHINE;
    ctx.lineWidth = cell * SHINE_RATIO;
    ctx.stroke();
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
