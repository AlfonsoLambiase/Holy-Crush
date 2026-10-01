import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {
  addBooster,
  getBoosterCount,
  isBoosterFull,
  spendBooster,
  type BoosterId,
} from "@/settings/boosters";
import {playClick, playMega, playNoTouch, playSuper} from "@/settings/click";
import {getCellSize, GRID_PIECE_FIT} from "../shared/config/grid-generation.const";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../shared/config/layout.const";
import {addCountBadge, type CountBadge} from "../shared/count-badge";
import {addFillPair, tweenRemaining, type FillPair} from "../shared/fill-pair";
import {showWatchAdPopup, type WatchAdPopup} from "../shared/watch-ad-popup";

const assetConf = CandyCrushAssetConf;

const FILL_MS = 1200;
const DRAG_PX = 18;
const SLOTS: {id: BoosterId; disabled: string; fill: string}[] = [
  {id: "super", disabled: "super_disabled", fill: "super"},
  {id: "mega", disabled: "mega_disabled", fill: "mega"},
];

type Slot = {
  id: BoosterId;
  fillKey: string;
  pair: FillPair;
  badge: CountBadge;
  size: number;
  x: number;
  y: number;
};

type Press = {
  id: BoosterId;
  x: number;
  y: number;
  dragged: boolean;
};

export class ItemsBar {
  #top = 0;
  #busy = false;
  #popup: WatchAdPopup | null = null;
  #press: Press | null = null;
  #ghost: Phaser.GameObjects.Image | null = null;
  #slots: Slot[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly scaleOf: (min: number, max: number) => number,
    private readonly cellAtWorld: (x: number, y: number) => unknown,
  ) {}

  get top(): number {
    return this.#top;
  }

  isOnBar(pointer: Phaser.Input.Pointer): boolean {
    return pointer.y >= this.#top;
  }

  isBlocking(): boolean {
    return this.#busy || Boolean(this.#popup) || Boolean(this.#press?.dragged);
  }

  create(): number {
    const {width, height} = this.scene.scale;

    if (!this.scene.textures.exists(assetConf.image.containerItems)) return height;

    const plaque = this.scene.add.image(0, 0, assetConf.image.containerItems).setScrollFactor(0);
    const iconSize = getCellSize(width) * GRID_PIECE_FIT;
    const pad = iconSize * 0.16;

    plaque.setDisplaySize(iconSize * 2 + pad * 4, iconSize + pad * 2).setDepth(8);
    const bottomMargin = this.scaleOf(16, 36);
    const sideInset = this.scaleOf(HEADER_INSET_MIN, HEADER_INSET_MAX);
    const rightNudge = this.scaleOf(28, 56);

    this.#top = height - bottomMargin - plaque.displayHeight;
    plaque
      .setOrigin(0.5, 0.5)
      .setX(width - sideInset - plaque.displayWidth / 2 + rightNudge)
      .setY(this.#top + plaque.displayHeight / 2);

    const y = plaque.y;

    SLOTS.forEach((spec, index) => {
      if (!this.scene.textures.exists(spec.disabled) || !this.scene.textures.exists(spec.fill)) return;

      const src = this.scene.textures.get(spec.disabled).getSourceImage() as {height: number};
      const x = plaque.x + (index === 0 ? -1 : 1) * (plaque.displayWidth * 0.25);
      const count = getBoosterCount(spec.id);
      const pair = addFillPair(
        this.scene,
        x,
        y,
        spec.disabled,
        spec.fill,
        iconSize / src.height,
        9,
        count > 0 ? 1 : 0,
        "wedge",
      );

      if (!pair) return;

      const badge = addCountBadge(this.scene, x + iconSize * 0.42, y - iconSize * 0.42, count, iconSize, 12);
      const zone = this.scene.add
        .zone(x, y, iconSize, iconSize)
        .setDepth(13)
        .setScrollFactor(0)
        .setInteractive({useHandCursor: true});

      zone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (this.#busy || this.#popup) return;

        this.#press = {id: spec.id, x: pointer.x, y: pointer.y, dragged: false};
      });

      this.#slots.push({id: spec.id, fillKey: spec.fill, pair, badge, size: iconSize, x, y});
    });

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.#onMove(pointer));
    this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.#onUp(pointer));

    return this.#top;
  }

  #onMove(pointer: Phaser.Input.Pointer) {
    if (!this.#press || this.#busy || this.#popup) return;

    const dist = Phaser.Math.Distance.Between(this.#press.x, this.#press.y, pointer.x, pointer.y);

    if (!this.#press.dragged && dist < DRAG_PX) return;
    if (getBoosterCount(this.#press.id) <= 0) return;

    this.#press.dragged = true;
    this.#moveGhost(this.#press.id, pointer);
  }

  #onUp(pointer: Phaser.Input.Pointer) {
    if (!this.#press) return;

    const {id, dragged} = this.#press;

    this.#press = null;

    if (dragged) {
      this.#drop(id, pointer);

      return;
    }

    if (isBoosterFull(id)) {
      playNoTouch();

      return;
    }

    this.#askUnlock(id);
  }

  #moveGhost(id: BoosterId, pointer: Phaser.Input.Pointer) {
    const slot = this.#slots.find((item) => item.id === id);

    if (!slot) return;

    if (!this.#ghost) {
      this.#ghost = this.scene.add
        .image(pointer.x, pointer.y, slot.fillKey)
        .setDepth(50)
        .setScrollFactor(0)
        .setDisplaySize(slot.size, slot.size)
        .setAlpha(0.92);
    } else {
      this.#ghost.setPosition(pointer.x, pointer.y);
    }
  }

  #drop(id: BoosterId, pointer: Phaser.Input.Pointer) {
    const onGrid = this.cellAtWorld(pointer.worldX, pointer.worldY);

    this.#ghost?.destroy();
    this.#ghost = null;

    if (!onGrid || !spendBooster(id)) return;

    if (id === "super") playSuper();
    else playMega();

    this.#sync(id);
  }

  #askUnlock(id: BoosterId) {
    const language = getCurrentLanguage();
    const titleKey = id === "super" ? "shopCross" : "shopStar";
    const bodyKey = id === "super" ? "shopCrossBody" : "shopStarBody";

    playClick();
    this.#popup = showWatchAdPopup(this.scene, {
      title: t(titleKey, language),
      body: t(bodyKey, language),
      scale: this.scaleOf(0.42, 0.9),
      onClose: () => {
        this.#popup = null;
      },
      onWatch: () => this.#unlock(id),
    });
  }

  #unlock(id: BoosterId) {
    const slot = this.#slots.find((item) => item.id === id);

    if (!slot || this.#busy || !addBooster(id)) return;

    const count = getBoosterCount(id);

    if (count === 1) {
      this.#busy = true;
      tweenRemaining(this.scene, slot.pair, 0, 1, FILL_MS, () => {
        slot.badge.setCount(count);
        this.#busy = false;
      });

      return;
    }

    slot.pair.setRemaining(1);
    slot.badge.setCount(count);
  }

  #sync(id: BoosterId) {
    const slot = this.#slots.find((item) => item.id === id);

    if (!slot) return;

    const count = getBoosterCount(id);

    slot.badge.setCount(count);
    slot.pair.setRemaining(count > 0 ? 1 : 0);
  }
}
