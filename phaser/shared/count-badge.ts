import * as Phaser from "phaser";

import {APP_FONT} from "./config/font.const";

const CHECK_KEY = "btnConfirm";

type BadgeObject = Phaser.GameObjects.Graphics | Phaser.GameObjects.Text | Phaser.GameObjects.Image;

export type CountBadge = {
  setCount: (count: number) => void;
  destroy: () => void;
  objects: BadgeObject[];
};

//* Pallino in alto a destra del png. Se count è 0 non si vede, se è Infinity mostra ∞.
//* Con showZero a 0 esce il visto invece del numero.
export const addCountBadge = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  count: number,
  size: number,
  depth = 12,
  parent?: Phaser.GameObjects.Container,
  showZero = false,
): CountBadge => {
  const radius = Math.max(14, size * 0.22);
  const fontSize = Math.round(radius * 1.15);
  const disk = scene.add.graphics();
  const label = scene.add
    .text(x, y, "", {
      fontFamily: APP_FONT,
      fontSize: `${fontSize}px`,
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: Math.max(3, Math.round(fontSize * 0.18)),
    })
    .setOrigin(0.5);
  const check = scene.textures.exists(CHECK_KEY)
    ? scene.add.image(x, y, CHECK_KEY).setOrigin(0.5).setVisible(false)
    : undefined;

  if (check) {
    const fit = (radius * 2.15) / Math.max(check.width, check.height);

    check.setScale(fit);
  }

  const extras = check ? [disk, label, check] : [disk, label];

  if (parent) {
    parent.add(extras);
  } else {
    disk.setDepth(depth).setScrollFactor(0);
    label.setDepth(depth + 1).setScrollFactor(0);
    check?.setDepth(depth + 2).setScrollFactor(0);
  }

  const paint = (value: number) => {
    const done = showZero && value === 0 && !!check;
    const visible = value > 0 || (showZero && value === 0);

    disk.clear();
    disk.setVisible(visible && !done);
    label.setVisible(visible && !done);
    check?.setVisible(done);

    if (!visible || done) return;

    disk.fillStyle(0xffd76a, 1);
    disk.fillCircle(x, y, radius);
    disk.lineStyle(Math.max(2, radius * 0.12), 0x2a160c, 1);
    disk.strokeCircle(x, y, radius);
    label.setText(Number.isFinite(value) ? `${value}` : "∞");
  };

  paint(count);

  return {
    setCount: paint,
    destroy: () => {
      disk.destroy();
      label.destroy();
      check?.destroy();
    },
    objects: extras,
  };
};
