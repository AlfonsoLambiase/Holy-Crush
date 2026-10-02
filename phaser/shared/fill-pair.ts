import * as Phaser from "phaser";

export type FillPair = {
  setRemaining: (remaining: number) => void;
};

export type FillShape = "rect" | "rectUp" | "wedge" | "radial";

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

    if (amount >= 1) {
      fill.clearMask(true);

      return;
    }

    maskGraphics = scene.add.graphics();
    maskGraphics.setScrollFactor(0);
    maskGraphics.setVisible(false);
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
    } else if (shape === "rectUp") {
      const left = fill.x - fill.displayWidth / 2;
      const h = fill.displayHeight * amount;
      const top = fill.y + fill.displayHeight / 2 - h;

      maskGraphics.fillRect(left, top, fill.displayWidth, h);
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

//* Un solo layer (es. riempimento slot sopra al frame).
export const addMaskedImageFill = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
  scale: number,
  depth = 9,
  remaining = 1,
  shape: FillShape = "wedge",
): FillPair | null => {
  if (!scene.textures.exists(key) || scale <= 0) return null;

  const fill = scene.add.image(x, y, key).setDepth(depth).setScrollFactor(0).setScale(scale);
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

    if (amount >= 1) {
      fill.clearMask(true);

      return;
    }

    maskGraphics = scene.add.graphics();
    maskGraphics.setScrollFactor(0);
    maskGraphics.setVisible(false);
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
    } else if (shape === "rectUp") {
      const left = fill.x - fill.displayWidth / 2;
      const h = fill.displayHeight * amount;
      const top = fill.y + fill.displayHeight / 2 - h;

      maskGraphics.fillRect(left, top, fill.displayWidth, h);
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

export const tweenRemainingSync = (
  scene: Phaser.Scene,
  pairs: FillPair[],
  from: number,
  to: number,
  duration: number,
  onDone?: () => void,
) => {
  if (pairs.length === 0) {
    onDone?.();

    return;
  }

  const fill = {amount: from};

  pairs.forEach((pair) => pair.setRemaining(from));
  scene.tweens.add({
    targets: fill,
    amount: to,
    duration,
    ease: "Sine.easeInOut",
    onUpdate: () => pairs.forEach((pair) => pair.setRemaining(fill.amount)),
    onComplete: () => {
      pairs.forEach((pair) => pair.setRemaining(to));
      onDone?.();
    },
  });
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
