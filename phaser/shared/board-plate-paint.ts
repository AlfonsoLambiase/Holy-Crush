import {boardContours, type BoardFillet} from "./board-outline";

export const PLATE_FILL = "#94a8d9";
export const PLATE_RIM = "#b39658";
export const PLATE_GOLD = "#a4874e";
export const PLATE_SHINE = "#f4e4bf";
export const PLATE_RIM_RATIO = 0.1;
export const PLATE_GOLD_RATIO = 0.062;
export const PLATE_SHINE_RATIO = 0.024;

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

export const boardPlatePad = (cell: number): number => Math.ceil((cell * PLATE_RIM_RATIO) / 2 + 4);

//* Disegna il contorno già arrotondato. L'origine è l'angolo in alto a sinistra della cella 0,0.
export function traceBoardPath(
  ctx: CanvasRenderingContext2D,
  open: readonly (readonly boolean[])[],
  cell: number,
  originX: number,
  originY: number,
): void {
  const contours = boardContours(open, cell, originX, originY);

  ctx.beginPath();

  for (const fillets of contours) drawContour(ctx, fillets);
}

export function strokeBoardRim(ctx: CanvasRenderingContext2D, cell: number): void {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = PLATE_RIM;
  ctx.lineWidth = cell * PLATE_RIM_RATIO;
  ctx.stroke();
  ctx.strokeStyle = PLATE_GOLD;
  ctx.lineWidth = cell * PLATE_GOLD_RATIO;
  ctx.stroke();
  ctx.strokeStyle = PLATE_SHINE;
  ctx.lineWidth = cell * PLATE_SHINE_RATIO;
  ctx.stroke();
}
