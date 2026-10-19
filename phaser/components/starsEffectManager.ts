import * as Phaser from "phaser";

import {isLowEndDevice} from "@/settings/app-header-layout";
import {isEffectsEnabled} from "@/settings/effects";

/** false = scoppio solo anello (comportamento precedente). */
export const BURST_INNER_STARS_ENABLED = true;

const RING_MS = 720;
const POOL_SIZE = 16;
const RING_TEXTURE_KEY = "burst-pop-ring-v2";
const STAR_TEXTURE_KEY = "burst-pop-star-v1";
const RING_TEX_SIZE = 128;
const RING_TEX_RADIUS = 50;
const RING_TEX_STROKE = 16;
const STAR_TEX_SIZE = 48;
const STAR_COUNT = 3;
const STAR_MS_RATIO = 0.85;
/** Scala massima stelle (molto piccole vs anello). */
const STAR_END_RING_RATIO = 0.21;
/** Posizioni fisse sparpagliate dentro il disco dell’anello (0–1 del raggio). */
const STAR_LAYOUT: ReadonlyArray<{angleDeg: number; radiusMul: number}> = [
  {angleDeg: 18, radiusMul: 0.52},
  {angleDeg: 132, radiusMul: 0.38},
  {angleDeg: 268, radiusMul: 0.61},
];

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

const ensureStarTexture = (scene: Phaser.Scene): void => {
  if (scene.textures.exists(STAR_TEXTURE_KEY)) return;

  const canvas = document.createElement("canvas");

  canvas.width = STAR_TEX_SIZE;
  canvas.height = STAR_TEX_SIZE;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const cx = STAR_TEX_SIZE / 2;
  const cy = STAR_TEX_SIZE / 2;
  const outer = STAR_TEX_SIZE * 0.42;
  const inner = outer * 0.38;
  const points = 4;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();

  scene.textures.addCanvas(STAR_TEXTURE_KEY, canvas);
};

type PooledBurst = {
  container: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Image;
  stars: Phaser.GameObjects.Image[];
  busy: boolean;
};

export class StarsEffectManager {
  private scene: Phaser.Scene;
  #pool: PooledBurst[] = [];
  #active = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    ensureRingTexture(scene);

    if (BURST_INNER_STARS_ENABLED) ensureStarTexture(scene);
  }

  #ensurePool(): void {
    ensureRingTexture(this.scene);

    if (BURST_INNER_STARS_ENABLED) ensureStarTexture(this.scene);

    while (this.#pool.length < POOL_SIZE) {
      const container = this.scene.add.container(0, 0).setVisible(false).setDepth(10_000);
      const ring = this.scene.add.image(0, 0, RING_TEXTURE_KEY).setOrigin(0.5);
      const stars: Phaser.GameObjects.Image[] = [];

      container.add(ring);

      if (BURST_INNER_STARS_ENABLED) {
        for (let i = 0; i < STAR_COUNT; i++) {
          const star = this.scene.add.image(0, 0, STAR_TEXTURE_KEY).setOrigin(0.5);

          container.add(star);
          stars.push(star);
        }
      }

      this.#pool.push({container, ring, stars, busy: false});
    }
  }

  #acquire(): PooledBurst | null {
    this.#ensurePool();

    if (this.#active >= maxActiveBursts()) return null;

    return this.#pool.find((slot) => !slot.busy) ?? null;
  }

  #resetStars(stars: Phaser.GameObjects.Image[]): void {
    for (const star of stars) {
      this.scene.tweens.killTweensOf(star);
      star.setScale(0.001);
      star.setAlpha(1);
      star.clearTint();
      star.setPosition(0, 0);
      star.setAngle(0);
    }
  }

  #release(slot: PooledBurst): void {
    this.scene.tweens.killTweensOf(slot.ring);
    slot.ring.setScale(0.001);
    slot.ring.setAlpha(1);
    slot.ring.clearTint();
    this.#resetStars(slot.stars);
    slot.container.setVisible(false);
    slot.busy = false;
    this.#active = Math.max(0, this.#active - 1);
  }

  #playInnerStars(stars: Phaser.GameObjects.Image[], endScale: number, tint?: number): void {
    if (!BURST_INNER_STARS_ENABLED || stars.length === 0) return;

    const fitStarScale = (endScale * STAR_END_RING_RATIO * RING_TEX_SIZE) / STAR_TEX_SIZE;
    const ringRadiusLocal = endScale * RING_TEX_RADIUS;

    stars.forEach((star, index) => {
      const layout = STAR_LAYOUT[index] ?? STAR_LAYOUT[0];
      const rad = Phaser.Math.DegToRad(layout.angleDeg);
      const dist = ringRadiusLocal * layout.radiusMul;

      const targetX = Math.cos(rad) * dist;
      const targetY = Math.sin(rad) * dist;

      star.setPosition(0, 0);
      star.setScale(0.001);
      star.setAlpha(1);
      star.setAngle(layout.angleDeg - 90);

      if (tint !== undefined) star.setTint(tint);
      else star.clearTint();

      this.scene.tweens.add({
        targets: star,
        x: targetX,
        y: targetY,
        scale: {from: 0.001, to: fitStarScale},
        alpha: {from: 1, to: 0},
        duration: RING_MS * STAR_MS_RATIO,
        ease: "Cubic.easeOut",
      });
    });
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
    tint?: number,
  ): void {
    if (!isEffectsEnabled()) return;

    const cap = maxActiveBursts();

    if (isLowEndDevice() && !emphasis && this.#active >= Math.max(1, cap - 2)) return;

    const slot = this.#acquire();

    if (!slot) return;

    const cell = Math.max(24, scale * CELL_FROM_SCALE);
    const outer = cell * 0.58;
    const endScale = (outer * 2) / RING_TEX_SIZE;

    const {container, ring, stars} = slot;

    slot.busy = true;
    this.#active += 1;

    ring.setScale(0.001);
    ring.setAlpha(1);

    if (tint !== undefined) ring.setTint(tint);
    else ring.clearTint();

    this.#resetStars(stars);

    container.setPosition(x, y);
    container.setVisible(true);

    if (parent) {
      if (container.parentContainer !== parent) parent.add(container);
      parent.bringToTop(container);
    }

    const withStars =
      BURST_INNER_STARS_ENABLED && !(isLowEndDevice() && !emphasis);

    if (withStars) this.#playInnerStars(stars, endScale, tint);

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
