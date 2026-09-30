import * as Phaser from "phaser";

export type FillPair = {
  setRemaining: (remaining: number) => void;
};

export type FillShape = "rect" | "wedge" | "radial";

//* bg sotto (vuoto), fill sopra.
//* radial: cerchio dal centro verso fuori. wedge: spicchio 360°.
export const addFillPair = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  bgKey: string,
  fillKey: string,
  scale: number,
  depth = 9,
  remaining = 1,
  shape: FillShape = "rect",
): FillPair | null => {
  if (!scene.textures.exists(bgKey) || !scene.textures.exists(fillKey) || scale <= 0) return null;

  const bg = scene.add.image(x, y, bgKey).setDepth(depth).setScrollFactor(0).setScale(scale);
  const fill = scene.add.image(x, y, fillKey).setDepth(depth + 1).setScrollFactor(0).setScale(scale);
  let maskGraphics: Phaser.GameObjects.Graphics | null = null;

  const setRemaining = (remaining: number) => {
    const amount = Phaser.Math.Clamp(remaining, 0, 1);

    fill.clearMask(true);
    maskGraphics?.destroy();
    maskGraphics = null;

    if (amount <= 0) {
      fill.setVisible(false);

      return;
    }

    fill.setVisible(true);

    if (amount >= 1) return;

    maskGraphics = scene.make.graphics({}, false);
    maskGraphics.fillStyle(0xffffff);

    if (shape === "radial") {
      maskGraphics.fillCircle(
        fill.x,
        fill.y,
        (Math.hypot(fill.displayWidth, fill.displayHeight) / 2) * amount,
      );
    } else if (shape === "wedge") {
      const radius = Math.max(fill.displayWidth, fill.displayHeight) / 2;
      const origin = -Math.PI / 2;

      maskGraphics.slice(fill.x, fill.y, radius, origin, origin + amount * Math.PI * 2, false);
      maskGraphics.fillPath();
    } else {
      const left = fill.x - fill.displayWidth / 2;
      const top = fill.y - fill.displayHeight / 2;

      maskGraphics.fillRect(left, top, fill.displayWidth * amount, fill.displayHeight);
    }

    fill.setMask(maskGraphics.createGeometryMask());
  };

  setRemaining(remaining);

  return {setRemaining};
};

export const tweenRemaining = (
  scene: Phaser.Scene,
  pair: FillPair,
  from: number,
  to: number,
  duration: number,
  onDone?: () => void,
) => {
  const fill = {amount: from};

  pair.setRemaining(from);
  scene.tweens.add({
    targets: fill,
    amount: to,
    duration,
    ease: "Sine.easeInOut",
    onUpdate: () => pair.setRemaining(fill.amount),
    onComplete: () => {
      pair.setRemaining(to);
      onDone?.();
    },
  });
};
