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
import {addMaskedImageFill, tweenRemainingSync, type FillPair} from "../shared/fill-pair";
import {showWatchAdPopup, type WatchAdPopup} from "../shared/watch-ad-popup";

const assetConf = CandyCrushAssetConf;

const FILL_MS = 1200;
const DRAG_PX = 18;
const DEPTH_FRAME = 8;
const DEPTH_CONTAINER_FILL = 9;
const DEPTH_ICON_DISABLED = 10;
const DEPTH_ICON_FILL = 11;
const DEPTH_BADGE = 12;
const DEPTH_ZONE = 13;
const SLOTS: {id: BoosterId; disabled: string; fill: string}[] = [
  {id: "super", disabled: "super_disabled", fill: "super"},
  {id: "mega", disabled: "mega_disabled", fill: "mega"},
];

type Slot = {
  id: BoosterId;
  fillKey: string;
  disabledKey: string;
  containerFill: FillPair;
  iconFill: FillPair;
  badge: CountBadge;
  iconDisabled: Phaser.GameObjects.Image;
  size: number;
  frameW: number;
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
    const frameKey = assetConf.image.containerItems;
    const fillKey = assetConf.image.containerItems_bg;

    if (!this.scene.textures.exists(frameKey) || !this.scene.textures.exists(fillKey)) return height;

    const iconSize = getCellSize(width) * GRID_PIECE_FIT;
    const frameSrc = this.scene.textures.get(frameKey).getSourceImage() as {width: number; height: number};
    const frameScale = iconSize / frameSrc.height;
    const frameW = frameSrc.width * frameScale;
    const frameH = frameSrc.height * frameScale;
    const gap = frameW * 0.14;
    const bottomMargin = this.scaleOf(16, 36);
    const sideInset = this.scaleOf(HEADER_INSET_MIN, HEADER_INSET_MAX);
    const rightNudge = this.scaleOf(28, 56);
    const barRight = width - sideInset + rightNudge;
    const y = height - bottomMargin - frameH / 2;
    const megaX = barRight - frameW / 2;
    const superX = megaX - frameW - gap;

    this.#top = y - frameH / 2;

    const slotX = [superX, megaX];

    SLOTS.forEach((spec, index) => {
      if (!this.scene.textures.exists(spec.disabled) || !this.scene.textures.exists(spec.fill)) return;

      const x = slotX[index];
      const count = getBoosterCount(spec.id);
      const iconSrc = this.scene.textures.get(spec.disabled).getSourceImage() as {height: number};
      const iconScale = (iconSize * 0.72) / iconSrc.height;

      this.scene.add
        .image(x, y, frameKey)
        .setScrollFactor(0)
        .setDepth(DEPTH_FRAME)
        .setScale(frameScale);

      const containerFill = addMaskedImageFill(
        this.scene,
        x,
        y,
        fillKey,
        frameScale,
        DEPTH_CONTAINER_FILL,
        count > 0 ? 1 : 0,
        "rectUp",
      );

      if (!containerFill) return;

      const iconDisabled = this.scene.add
        .image(x, y, spec.disabled)
        .setScrollFactor(0)
        .setDepth(DEPTH_ICON_DISABLED)
        .setScale(iconScale);

      const iconFill = addMaskedImageFill(
        this.scene,
        x,
        y,
        spec.fill,
        iconScale,
        DEPTH_ICON_FILL,
        count > 0 ? 1 : 0,
        "rectUp",
      );

      if (!iconFill) return;

      const badge = addCountBadge(
        this.scene,
        x + frameW * 0.38,
        y - frameH * 0.38,
        count,
        frameW,
        DEPTH_BADGE,
      );

      const zone = this.scene.add
        .zone(x, y, frameW, frameH)
        .setDepth(DEPTH_ZONE)
        .setScrollFactor(0)
        .setInteractive({useHandCursor: true});

      zone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (this.#busy || this.#popup) return;

        this.#press = {id: spec.id, x: pointer.x, y: pointer.y, dragged: false};
      });

      this.#slots.push({
        id: spec.id,
        fillKey: spec.fill,
        disabledKey: spec.disabled,
        containerFill,
        iconFill,
        badge,
        iconDisabled,
        size: iconSize * 0.72,
        frameW,
        x,
        y,
      });
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
      slot.iconDisabled.setVisible(true);
      tweenRemainingSync(this.scene, [slot.containerFill, slot.iconFill], 0, 1, FILL_MS, () => {
        slot.badge.setCount(count);
        this.#busy = false;
      });

      return;
    }

    slot.iconDisabled.setVisible(true);
    slot.containerFill.setRemaining(1);
    slot.iconFill.setRemaining(1);
    slot.badge.setCount(count);
  }

  #sync(id: BoosterId) {
    const slot = this.#slots.find((item) => item.id === id);

    if (!slot) return;

    const count = getBoosterCount(id);
    const full = count > 0;

    slot.badge.setCount(count);
    slot.iconDisabled.setVisible(true);
    slot.containerFill.setRemaining(full ? 1 : 0);
    slot.iconFill.setRemaining(full ? 1 : 0);
  }
}
