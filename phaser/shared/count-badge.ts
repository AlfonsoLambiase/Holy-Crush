import * as Phaser from "phaser";

import {APP_FONT} from "./config/font.const";

export type CountBadge = {
  setCount: (count: number) => void;
  destroy: () => void;
  objects: Phaser.GameObjects.GameObject[];
};

//* Pallino in alto a destra del png. Se count è 0 non si vede.
export const addCountBadge = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  count: number,
  size: number,
  depth = 12,
  parent?: Phaser.GameObjects.Container,
): CountBadge => {
  const radius = Math.max(14, size * 0.22);
  const disk = scene.add.graphics();
  const label = scene.add
    .text(x, y, "", {
      fontFamily: APP_FONT,
      fontSize: `${Math.round(radius * 1.15)}px`,
      color: "#ffffff",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  if (parent) {
    parent.add([disk, label]);
  } else {
    disk.setDepth(depth).setScrollFactor(0);
    label.setDepth(depth + 1).setScrollFactor(0);
  }

  const paint = (value: number) => {
    const visible = value > 0;

    disk.clear();
    disk.setVisible(visible);
    label.setVisible(visible);

    if (!visible) return;

    disk.fillStyle(0xffd76a, 1);
    disk.fillCircle(x, y, radius);
    disk.lineStyle(Math.max(3, radius * 0.22), 0x2a160c, 1);
    disk.strokeCircle(x, y, radius);
    label.setText(`${value}`);
  };

  paint(count);

  return {
    setCount: paint,
    destroy: () => {
      disk.destroy();
      label.destroy();
    },
    objects: [disk, label],
  };
};
