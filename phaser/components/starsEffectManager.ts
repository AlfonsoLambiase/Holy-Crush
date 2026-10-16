import * as Phaser from "phaser";

import {isEffectsEnabled} from "@/settings/effects";

const MAX_ACTIVE_STARS = 64;

const RING_MS = 820;

/** Da game-manager: `min(cellW, cellH) / 92`. */
const CELL_FROM_SCALE = 92;

const paintRing = (
  graphics: Phaser.GameObjects.Graphics,
  radius: number,
  lineWidth: number,
  alpha: number,
): void => {
  graphics.clear();
  graphics.lineStyle(lineWidth, 0xffffff, alpha);
  graphics.strokeCircle(0, 0, radius);
};

export class StarsEffectManager {
  private scene: Phaser.Scene;
  #active = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  #spawnRing(
    burst: Phaser.GameObjects.Container,
    ringRadius: number,
    ringStroke: number,
    delayMs: number,
    maxScale: number,
  ): void {
    const ring = this.scene.add.graphics();

    paintRing(ring, ringRadius, ringStroke, 1);
    burst.add(ring);
    ring.setScale(0.001);
    ring.setAlpha(1);

    const repaint = (g: Phaser.GameObjects.Graphics) => {
      const progress = Math.max(0.001, g.scaleX);
      const thin = ringStroke * (0.72 + 0.28 / progress);

      paintRing(g, ringRadius, thin, g.alpha);
    };

    this.scene.tweens.add({
      targets: ring,
      scale: {from: 0.001, to: maxScale},
      duration: RING_MS,
      ease: "Cubic.easeOut",
      delay: delayMs,
      onUpdate: (_tween, target) => repaint(target as Phaser.GameObjects.Graphics),
    });

    this.scene.tweens.add({
      targets: ring,
      alpha: {from: 1, to: 0},
      duration: RING_MS,
      ease: "Quad.easeIn",
      delay: delayMs,
      onUpdate: (_tween, target) => repaint(target as Phaser.GameObjects.Graphics),
    });
  }

  playAt(x: number, y: number, parent?: Phaser.GameObjects.Container, scale: number = 0.5): void {
    if (!isEffectsEnabled()) return;
    if (this.#active >= MAX_ACTIVE_STARS) return;

    const burst = this.scene.add.container(x, y);

    burst.setDepth(10_000);

    const cell = Math.max(24, scale * CELL_FROM_SCALE);
    const ringRadius = cell * 0.12;
    const ringStroke = Math.max(2.5, cell * 0.046);

    const outerPrimary = cell * 0.42;
    const outerSecondary = cell * 0.37;

    this.#spawnRing(burst, ringRadius, ringStroke, 0, outerPrimary / ringRadius);
    this.#spawnRing(burst, ringRadius, ringStroke * 0.88, 110, outerSecondary / ringRadius);

    if (parent) {
      parent.add(burst);
      parent.bringToTop(burst);
    }

    this.#active += 1;

    const lifeMs = RING_MS + 220;

    this.scene.time.delayedCall(lifeMs, () => {
      if (burst.active) burst.destroy(true);
      this.#active = Math.max(0, this.#active - 1);
    });
  }
}
