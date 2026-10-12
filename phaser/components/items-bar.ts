import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {
  addBooster,
  getBoosterCount,
  isBoosterFull,
  spendBooster,
  type BoosterId,
} from "@/settings/boosters";
import {phaserImageScale, resolveHeaderMetrics} from "@/settings/app-header-layout";
import {BTN_READ_NATIVE_HEIGHT} from "@/settings/app-header-tokens";
import {playClick, playMaxi, playMega, playNoTouch, playSuper, playUltra} from "@/settings/click";
import {getCellSize, GRID_PIECE_FIT} from "../shared/config/grid-generation.const";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import type {Cell} from "../shared/match3";
import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../shared/config/layout.const";
import {addCountBadge, type CountBadge} from "../shared/count-badge";
import {addMaskedImageFill, tweenRemainingSync, type FillPair} from "../shared/fill-pair";
import {popupPlateScale} from "../shared/popup-plate-scale";
import {showWatchAdPopup, type WatchAdPopup} from "../shared/watch-ad-popup";
import {GameSettingsMenu} from "./game-settings-menu";
import type {Game} from "../scenes/game";

const assetConf = CandyCrushAssetConf;

const FILL_MS = 1200;
const DRAG_PX = 18;
const ROW_RIGHT_EDGE_MIN = 4;
const ROW_RIGHT_EDGE_MAX = 12;
const ROW_RIGHT_EXTRA_PULL_MIN = 28;
const ROW_RIGHT_EXTRA_PULL_MAX = 56;
const DEPTH_FRAME = 8;
const DEPTH_CONTAINER_FILL = 9;
const DEPTH_ICON_DISABLED = 10;
const DEPTH_ICON_FILL = 11;
const DEPTH_BADGE = 12;
const DEPTH_ZONE = 13;
const SLOTS: {
  id: BoosterId;
  disabled: string;
  fill: string;
  titleKey: string;
  bodyKey: string;
}[] = [
  //* Da sinistra a destra. Il bottone impostazioni sta a destra, quindi l'ordine letto da lì è super, mega, ultra, maxi.
  {id: "maxi", disabled: "maxi_disabled", fill: "maxi", titleKey: "shopMaxi", bodyKey: "shopMaxiBody"},
  {id: "ultra", disabled: "ultra_disabled", fill: "ultra", titleKey: "shopScythe", bodyKey: "shopScytheBody"},
  {id: "mega", disabled: "mega_disabled", fill: "mega", titleKey: "shopStar", bodyKey: "shopStarBody"},
  {id: "super", disabled: "super_disabled", fill: "super", titleKey: "shopCross", bodyKey: "shopCrossBody"},
];

const DROP_SFX: Record<BoosterId, () => void> = {
  super: playSuper,
  mega: playMega,
  maxi: playMaxi,
  ultra: playUltra,
};

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
  #settingsMenu: GameSettingsMenu | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly scaleOf: (min: number, max: number) => number,
    private readonly cellAtWorld: (x: number, y: number) => Cell | null,
    private readonly gameScene: Game,
    private readonly onDrop: (id: BoosterId, cell: Cell) => boolean,
  ) {}

  get top(): number {
    return this.#top;
  }

  isOnBar(pointer: Phaser.Input.Pointer): boolean {
    if (this.#slots.length === 0) return false;

    return pointer.y >= this.#top;
  }

  isBlocking(): boolean {
    return (
      this.#busy ||
      Boolean(this.#popup) ||
      Boolean(this.#press?.dragged) ||
      Boolean(this.#settingsMenu?.isBlocking())
    );
  }

  create(): number {
    const {width, height} = this.scene.scale;
    const frameKey = assetConf.image.containerItems_bg;
    const fillKey = assetConf.image.containerItems;

    if (!this.scene.textures.exists(frameKey) || !this.scene.textures.exists(fillKey)) return height;

    let iconSize = getCellSize(width) * GRID_PIECE_FIT;
    const frameSrc = this.scene.textures.get(frameKey).getSourceImage() as {width: number; height: number};
    let frameScale = iconSize / frameSrc.height;
    let frameW = frameSrc.width * frameScale;
    let frameH = frameSrc.height * frameScale;
    let gap = frameW * 0.14;
    const bottomMargin = this.scaleOf(16, 36);
    const sideInset = this.scaleOf(HEADER_INSET_MIN, HEADER_INSET_MAX);
    let y = height - bottomMargin - frameH / 2;

    const safeTop = Number(this.scene.registry.get("safeTop")) || 0;
    const cornerBtnH = resolveHeaderMetrics(
      "inGame",
      width,
      height,
      safeTop,
      BTN_READ_NATIVE_HEIGHT,
    ).cornerButtonPhysical;

    const settingsKey = assetConf.image.settingsHome;
    const hasSettings = this.scene.textures.exists(settingsKey);
    let settingsW = 0;
    let buttonDisplayH = cornerBtnH;

    let settingsSrc: {width: number; height: number} | null = null;

    if (hasSettings) {
      settingsSrc = this.scene.textures.get(settingsKey).getSourceImage() as {
        width: number;
        height: number;
      };

      settingsW =
        settingsSrc.width * phaserImageScale(settingsSrc.height, buttonDisplayH);
    }

    const settingsGap = gap;
    const slotCount = SLOTS.length;
    let slotsSpan = frameW * slotCount + gap * Math.max(0, slotCount - 1);
    const availableW = width - sideInset * 2;
    const rowBudget = availableW - (hasSettings ? settingsGap + settingsW * 0.72 : 0);

    if (slotsSpan > rowBudget && rowBudget > 0) {
      const fit = rowBudget / slotsSpan;

      frameW *= fit;
      frameH *= fit;
      frameScale *= fit;
      iconSize *= fit;
      gap = frameW * 0.14;
      slotsSpan = frameW * slotCount + gap * Math.max(0, slotCount - 1);
      y = height - bottomMargin - frameH / 2;
    }

    let rowW = slotsSpan + (hasSettings ? settingsGap + settingsW : 0);

    if (hasSettings && settingsSrc && rowW > availableW) {
      const maxSettingsW = Math.max(availableW - (slotsSpan + settingsGap), 0);

      if (settingsW > maxSettingsW && settingsW > 0) {
        buttonDisplayH = cornerBtnH * (maxSettingsW / settingsW);
        settingsW = maxSettingsW;
        rowW = slotsSpan + settingsGap + settingsW;
      }
    }

    const rowRightEdge =
      width -
      Math.max(
        this.scaleOf(ROW_RIGHT_EDGE_MIN, ROW_RIGHT_EDGE_MAX),
        sideInset - this.scaleOf(ROW_RIGHT_EXTRA_PULL_MIN, ROW_RIGHT_EXTRA_PULL_MAX),
      );
    const rowLeft = Math.max(sideInset * 0.55, rowRightEdge - rowW);

    const slotX = SLOTS.map((_, index) => rowLeft + frameW / 2 + index * (frameW + gap));
    const lastSlotX = slotX[slotX.length - 1] ?? rowLeft + frameW / 2;
    const settingsX = hasSettings ? lastSlotX + frameW / 2 + settingsGap + settingsW / 2 : 0;

    this.#top = y - frameH / 2;

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
        if (this.#busy || this.#popup || this.#settingsMenu?.isOpen()) return;

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

    if (hasSettings && buttonDisplayH > 0) {
      this.#settingsMenu = new GameSettingsMenu(this.scene, this.scaleOf, this.gameScene);
      this.#settingsMenu.create(settingsX, y, buttonDisplayH);
    }

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
    const cell = this.cellAtWorld(pointer.worldX, pointer.worldY);

    this.#ghost?.destroy();
    this.#ghost = null;

    if (!cell || getBoosterCount(id) <= 0 || !this.onDrop(id, cell) || !spendBooster(id)) return;

    DROP_SFX[id]();

    this.#sync(id);
  }

  #askUnlock(id: BoosterId) {
    const language = getCurrentLanguage();
    const spec = SLOTS.find((slot) => slot.id === id);
    const titleKey = spec?.titleKey ?? "shopScythe";
    const bodyKey = spec?.bodyKey ?? "shopScytheBody";

    playClick();
    this.#popup = showWatchAdPopup(this.scene, {
      title: t(titleKey, language),
      body: t(bodyKey, language),
      adId: id,
      scale: popupPlateScale(this.scene, assetConf.image.popupExitGame),
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
