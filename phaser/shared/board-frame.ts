import * as Phaser from "phaser";

import {boardContours, type BoardFillet} from "./board-outline";

const PLATE_KEY = "board-plate";
const FILL = "#94a8d9";
const RIM = "#c87b0c";
const GOLD = "#ffd12a";
const SHINE = "#ffe98a";
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

const plateCanvas = (
  open: readonly (readonly boolean[])[],
  cell: number,
  gridLeft: number,
  gridTop: number,
): {canvas: HTMLCanvasElement; pad: number; width: number; height: number} | null => {
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

  ctx.fillStyle = FILL;
  ctx.fill("evenodd");
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = RIM;
  ctx.lineWidth = rim;
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = cell * GOLD_RATIO;
  ctx.stroke();
  ctx.strokeStyle = SHINE;
  ctx.lineWidth = cell * SHINE_RATIO;
  ctx.stroke();

  return {canvas, pad, width, height};
};

//* Placca sotto i pezzi: fondo celeste e cornice dorata che segue i buchi.
export function createBoardPlate(
  scene: Phaser.Scene,
  open: readonly (readonly boolean[])[],
  cell: number,
  gridLeft: number,
  gridTop: number,
): Phaser.GameObjects.Image | null {
  const plate = plateCanvas(open, cell, gridLeft, gridTop);

  if (!plate) return null;

  if (scene.textures.exists(PLATE_KEY)) scene.textures.remove(PLATE_KEY);

  scene.textures.addCanvas(PLATE_KEY, plate.canvas);

  return scene.add
    .image(gridLeft - plate.pad, gridTop - plate.pad, PLATE_KEY)
    .setOrigin(0, 0)
    .setDisplaySize(plate.width, plate.height);
}

export function destroyBoardPlate(scene: Phaser.Scene, image: Phaser.GameObjects.Image | null): void {
  if (image?.active) image.destroy();
  if (scene.textures.exists(PLATE_KEY)) scene.textures.remove(PLATE_KEY);
}
