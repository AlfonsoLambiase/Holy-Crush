import * as Phaser from "phaser";

import {APP_FONT} from "./config/font.const";

const CHECK_KEY = "btnConfirm";

type BadgeObject = Phaser.GameObjects.Graphics | Phaser.GameObjects.Text | Phaser.GameObjects.Image;

export type CountBadgeStyle = "disk" | "goalNumber";

export type CountBadge = {
  setCount: (count: number) => void;
  destroy: () => void;
  objects: BadgeObject[];
};

//* Pallino in alto a destra del png. Se count è 0 non si vede, se è Infinity mostra ∞.
//* Con showZero a 0 esce il visto invece del numero.
//* goalNumber = solo cifra grande (obiettivi HUD), nera con contorno bianco.
export const addCountBadge = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  count: number,
  size: number,
  depth = 12,
  parent?: Phaser.GameObjects.Container,
  showZero = false,
  style: CountBadgeStyle = "disk",
): CountBadge => {
  const radius = Math.max(14, size * 0.22);
  const goalNumber = style === "goalNumber";
  const fontSize = goalNumber
    ? Math.round(radius * 2.05)
    : Math.round(radius * 1.15);

  const disk = goalNumber ? null : scene.add.graphics();
  const label = scene.add
    .text(x, y, "", {
      fontFamily: APP_FONT,
      fontSize: `${fontSize}px`,
      color: goalNumber ? "#000000" : "#ffffff",
      fontStyle: "bold",
      stroke: goalNumber ? "#ffffff" : "#000000",
      strokeThickness: goalNumber
        ? Math.max(4, Math.round(fontSize * 0.12))
        : Math.max(3, Math.round(fontSize * 0.18)),
    })
    .setOrigin(0.5);
  const check = scene.textures.exists(CHECK_KEY)
    ? scene.add.image(x, y, CHECK_KEY).setOrigin(0.5).setVisible(false)
    : undefined;

  if (check) {
    const fit = (radius * 2.15) / Math.max(check.width, check.height);

    check.setScale(fit);
  }

  const extras = [disk, label, check].filter((obj): obj is BadgeObject => obj != null);

  if (parent) {
    parent.add(extras);
  } else {
    let layer = depth;

    for (const obj of extras) {
      obj.setDepth(layer).setScrollFactor(0);
      layer += 1;
    }
  }

  const paint = (value: number) => {
    const done = showZero && value === 0 && !!check;
    const visible = value > 0 || (showZero && value === 0);

    disk?.clear();
    disk?.setVisible(visible && !done && !goalNumber);
    label.setVisible(visible && !done);
    check?.setVisible(done);

    if (!visible || done) return;

    if (!goalNumber && disk) {
      disk.fillStyle(0xffd76a, 1);
      disk.fillCircle(x, y, radius);
      disk.lineStyle(Math.max(2, radius * 0.12), 0x2a160c, 1);
      disk.strokeCircle(x, y, radius);
    }

    label.setText(Number.isFinite(value) ? `${value}` : "∞");
  };

  paint(count);

  return {
    setCount: paint,
    destroy: () => {
      disk?.destroy();
      label.destroy();
      check?.destroy();
    },
    objects: extras,
  };
};
