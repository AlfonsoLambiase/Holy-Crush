import * as Phaser from "phaser";

import {isLowEndDevice} from "@/settings/app-header-layout";
import {isEffectsEnabled} from "@/settings/effects";

const RING_MS = 720;
const POOL_SIZE = 16;
const RING_TEXTURE_KEY = "burst-pop-ring-v2";
const RING_TEX_SIZE = 128;
const RING_TEX_RADIUS = 50;
const RING_TEX_STROKE = 16;

/** Da game-manager: `min(cellW, cellH) / 92`. */
const CELL_FROM_SCALE = 92;

const maxActiveBursts = (): number => (isLowEndDevice() ? 10 : 16);

const ensureRingTexture = (scene: Phaser.Scene): void => {
  if (scene.textures.exists(RING_TEXTURE_KEY)) return;

  const canvas = document.createElement("canvas");

  canvas.width = RING_TEX_SIZE;
  canvas.height = RING_TEX_SIZE;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = RING_TEX_STROKE;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(RING_TEX_SIZE / 2, RING_TEX_SIZE / 2, RING_TEX_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  scene.textures.addCanvas(RING_TEXTURE_KEY, canvas);
};

type PooledBurst = {
  container: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Image;
  busy: boolean;
};

export class StarsEffectManager {
  private scene: Phaser.Scene;
  #pool: PooledBurst[] = [];
  #active = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    ensureRingTexture(scene);
  }

  #ensurePool(): void {
    ensureRingTexture(this.scene);

    while (this.#pool.length < POOL_SIZE) {
      const container = this.scene.add.container(0, 0).setVisible(false).setDepth(10_000);
      const ring = this.scene.add.image(0, 0, RING_TEXTURE_KEY).setOrigin(0.5);

      container.add(ring);
      this.#pool.push({container, ring, busy: false});
    }
  }

  #acquire(): PooledBurst | null {
    this.#ensurePool();

    if (this.#active >= maxActiveBursts()) return null;

    return this.#pool.find((slot) => !slot.busy) ?? null;
  }

  #release(slot: PooledBurst): void {
    this.scene.tweens.killTweensOf(slot.ring);
    slot.ring.setScale(0.001);
    slot.ring.setAlpha(1);
    slot.container.setVisible(false);
    slot.busy = false;
    this.#active = Math.max(0, this.#active - 1);
  }

  /**
   * @param emphasis Su device deboli, se il pool è quasi pieno passa true solo per centri bomba/special.
   */
  playAt(
    x: number,
    y: number,
    parent?: Phaser.GameObjects.Container,
    scale: number = 0.5,
    emphasis = false,
  ): void {
    if (!isEffectsEnabled()) return;

    const cap = maxActiveBursts();

    if (isLowEndDevice() && !emphasis && this.#active >= Math.max(1, cap - 2)) return;

    const slot = this.#acquire();

    if (!slot) return;

    const cell = Math.max(24, scale * CELL_FROM_SCALE);
    const outer = cell * 0.58;
    const endScale = (outer * 2) / RING_TEX_SIZE;

    const {container, ring} = slot;

    slot.busy = true;
    this.#active += 1;

    ring.setScale(0.001);
    ring.setAlpha(1);

    container.setPosition(x, y);
    container.setVisible(true);

    if (parent) {
      if (container.parentContainer !== parent) parent.add(container);
      parent.bringToTop(container);
    }

    this.scene.tweens.add({
      targets: ring,
      scale: {from: 0.001, to: endScale},
      alpha: {from: 1, to: 0},
      duration: RING_MS,
      ease: "Cubic.easeOut",
      onComplete: () => this.#release(slot),
    });
  }
}
