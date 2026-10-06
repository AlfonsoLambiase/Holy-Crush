import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {playBook, playClick, playNoTouch, playPulse, playRecharge, playUnlocked} from "@/settings/click";
import {getHeartRemaining, isHeartEmpty, refillHeart, spendHeart} from "@/settings/heart";
import {getStageIndex, getUnlockedCount} from "@/settings/progress";
import {darkenHex, getStageLevelNumber, getStageMap, type StageMapConfig} from "@/settings/stage-map";
import {playStageTrack} from "@/settings/soundtrack";
import {
  computeStageMapCornerButtons,
  computeStageHeaderLayout,
  computeStageMapHeartLayout,
  STAGE_BTN_READ_HEIGHT,
} from "@/settings/stage-hud-layout";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {addStageHeart, type StageHeart} from "../shared/stage-heart";
import {EventBus, PhaserEvents} from "../shared/event-bus";
import {dynamicValueForViewport} from "../shared/viewport-scale";
import {ROAD_TILES, stackedLevelPointsFallback, stackedLevelPointsFromImage} from "../shared/road-path";
import {showWatchAdPopup, type WatchAdPopup} from "../shared/watch-ad-popup";

const assetConf = CandyCrushAssetConf;

const LEVEL_SCALE = 0.11;
const LEVEL_PULSE_SCALE_MUL = 1.24;
const LEVEL_PULSE_MS = 750;
const RECHARGE_MS = 1200;
const PATH_FADE_ALPHA = 0.1;
const PATH_FADE_PX = 56;
const PATH_FADE_TOP_EXTRA = 58;
const PAN_DRAG_THRESHOLD = 12;
const SCROLL_WHEEL_FACTOR = 0.85;
const SCROLL_INERTIA_MUL = 0.62;
const SCROLL_INERTIA_MAX = 42;
const SCROLL_FRICTION = 0.9;
const SCROLL_VEL_STOP = 0.2;
const UNLOCK_SWAY_MS = 980;
const UNLOCK_SWAY_X = 4;
const UNLOCK_FALL_Y = 140;
const UNLOCK_FALL_MS = 520;

type LevelLayer = {
  plate: Phaser.GameObjects.Container;
  worldY: number;
  levelContent: Phaser.GameObjects.Container;
  shouldPulse: boolean;
};

export class StageMapScene extends Phaser.Scene {
  #heart: StageHeart | null = null;
  #headerHeartY = 0;
  #headerHeartSize = 0;
  #energyPopup: WatchAdPopup | null = null;
  #rechargeTween: Phaser.Tweens.Tween | null = null;
  #rechargeSafety: Phaser.Time.TimerEvent | null = null;
  #recharging = false;
  #leaving = false;
  #panning = false;
  #panFrom: number | null = null;
  #roadMask: Phaser.GameObjects.Graphics | null = null;
  #bandTop = 0;
  #bandHeight = 0;
  #fadeTop = 0;
  #fadeBottom = 0;
  #levelLayers: LevelLayer[] = [];
  #unlockRevealActive = false;
  #stopUnlockSfx: (() => void) | null = null;
  #onScrollDown: ((pointer: Phaser.Input.Pointer) => void) | null = null;
  #onScrollMove: ((pointer: Phaser.Input.Pointer) => void) | null = null;
  #onScrollUp: (() => void) | null = null;
  #onScrollWheel: ((pointer: Phaser.Input.Pointer, over: unknown, dx: number, dy: number) => void) | null = null;
  #emitShellReady = false;
  #maxScrollY = 0;
  #scrollDirty = false;
  #scrollVelocity = 0;
  #lastPanDy = 0;

  constructor() {
    super({key: assetConf.scene.stageMap});
  }

  init(data?: {emitShellReady?: boolean}) {
    this.#emitShellReady = data?.emitShellReady ?? false;
  }

  shutdown() {
    this.#stopUnlockSfx?.();
    this.#stopUnlockSfx = null;
    this.#unbindScroll();
    this.#cancelRecharge();
    this.#roadMask?.destroy();
    this.#roadMask = null;
    this.#scrollVelocity = 0;
  }

  update(_time: number, delta: number) {
    const frame = Math.max(1, delta);

    if (this.#panFrom === null && Math.abs(this.#scrollVelocity) > SCROLL_VEL_STOP) {
      this.cameras.main.scrollY += this.#scrollVelocity * (frame / 16.667);
      this.#scrollVelocity *= Math.pow(SCROLL_FRICTION, frame / 16.667);
      this.#markScrollDirty();
    }

    if (this.#scrollDirty) {
      this.#clampScrollY();
      this.#syncMapFade();
      this.#scrollDirty = false;
    }
  }

  create() {
    this.#leaving = false;
    this.#heart = null;
    this.#cancelRecharge();
    this.#recharging = false;
    this.#energyPopup = null;
    this.#levelLayers = [];
    const {width, height} = this.scale;
    const stage = getStageIndex();
    const unlocked = getUnlockedCount();
    const map = getStageMap(stage);
    const mascotH = this.#mascotDisplayHeight(width, height);
    const fade = this.#uiFadeBands(width, height, mascotH);
    const placed = this.#placeRoad(width, height, map.levels, fade);

    playStageTrack(stage);

    this.add
      .image(width / 2, height / 2, assetConf.image.backgroundStage)
      .setDisplaySize(width, height)
      .setDepth(0)
      .setScrollFactor(0);

    this.#fadeTop = fade.top;
    this.#fadeBottom = fade.bottom;
    this.#bandTop = fade.top;
    this.#bandHeight = Math.max(1, fade.bottom - fade.top);
    this.#addMascot(width, height, placed.worldH, map);
    this.#addRoad(width, placed);

    const unlockReveal = this.registry.get("stageMapUnlockReveal") === true;
    const revealLevelIndex = unlockReveal ? unlocked - 1 : -1;

    if (unlockReveal) {
      this.registry.remove("stageMapUnlockReveal");
    }

    const buttonPx = this.#levelButtonSize(width, height, placed.stops);

    placed.stops.forEach((stop, index) => {
      const isOpen = index < unlocked;
      const isCurrent = isOpen && index === unlocked - 1;

      this.#addLevelButton(
        stop.x,
        stop.y,
        buttonPx,
        index + 1,
        getStageLevelNumber(stage, index),
        isOpen,
        isCurrent && !unlockReveal,
        map,
        index === revealLevelIndex,
      );
    });

    this.#addHeader();
    this.#bindScroll(width, height, placed.worldH, map.levels, placed.stops, unlocked);

    if (unlockReveal && revealLevelIndex >= 0) {
      this.#runUnlockReveal(revealLevelIndex);
    }

    if (this.#emitShellReady) {
      EventBus.emit(PhaserEvents.OPENING_READY);
      this.#emitShellReady = false;
    }
  }

  #placeRoad(
    width: number,
    screenH: number,
    levels: number,
    fade: {top: number; bottom: number},
  ) {
    const bandTop = fade.top;
    const bandBottom = Math.max(bandTop + 1, fade.bottom);
    const key = assetConf.image.road;
    const source = this.#roadSource(key);
    const frameW = source?.width || 900;
    const frameH = source?.height || 1600;
    const dispW = width;
    const dispH = frameH * (dispW / frameW);
    const stackH = dispH * ROAD_TILES;
    const roadTop = bandTop;
    const worldH = Math.max(screenH, roadTop + stackH + (screenH - bandBottom));
    const roadLeft = (width - dispW) / 2;
    const cacheKey = `${source?.src ?? key}:marks7`;
    const points = source
      ? stackedLevelPointsFromImage(source, levels, cacheKey)
      : stackedLevelPointsFallback(levels);
    const stops = points.map((point) => ({
      x: roadLeft + point.x * dispW,
      y: roadTop + point.y * stackH,
    }));

    return {worldH, roadTop, dispW, dispH, stackH, stops};
  }

  #roadSource(key: string) {
    if (!this.textures.exists(key)) return null;

    const image = this.textures.get(key).getSourceImage() as CanvasImageSource & {
      width: number;
      height: number;
      src?: string;
    };

    if (!image || image.width < 2 || image.height < 2) return null;

    return image;
  }

  #addRoad(
    width: number,
    placed: {roadTop: number; dispW: number; dispH: number},
  ) {
    const key = assetConf.image.road;

    if (!this.textures.exists(key)) return;

    this.#roadMask = this.make.graphics();
    this.children.remove(this.#roadMask);
    this.#roadMask.fillStyle(0xffffff);
    const mask = this.#roadMask.createGeometryMask();

    for (let tile = 0; tile < ROAD_TILES; tile += 1) {
      this.add
        .image(width / 2, placed.roadTop + tile * placed.dispH, key)
        .setOrigin(0.5, 0)
        .setDisplaySize(placed.dispW, placed.dispH)
        .setDepth(2)
        .setMask(mask);
    }
  }

  #levelButtonSize(width: number, height: number, stops: {x: number; y: number}[]) {
    let minGap = Math.min(width, height);

    for (let index = 1; index < stops.length; index += 1) {
      minGap = Math.min(
        minGap,
        Phaser.Math.Distance.Between(
          stops[index - 1].x,
          stops[index - 1].y,
          stops[index].x,
          stops[index].y,
        ),
      );
    }

    return Math.min(Math.min(width, height) * LEVEL_SCALE, (minGap / LEVEL_PULSE_SCALE_MUL) * 0.9);
  }

  #fadeAlpha(screenY: number): number {
    if (screenY <= this.#fadeTop) {
      if (screenY <= this.#fadeTop - PATH_FADE_PX) return PATH_FADE_ALPHA;

      const t = (screenY - (this.#fadeTop - PATH_FADE_PX)) / PATH_FADE_PX;

      return PATH_FADE_ALPHA + t * (1 - PATH_FADE_ALPHA);
    }

    if (screenY >= this.#fadeBottom) {
      if (screenY >= this.#fadeBottom + PATH_FADE_PX) return PATH_FADE_ALPHA;

      const t = (this.#fadeBottom + PATH_FADE_PX - screenY) / PATH_FADE_PX;

      return PATH_FADE_ALPHA + t * (1 - PATH_FADE_ALPHA);
    }

    return 1;
  }

  #clampScrollY() {
    this.cameras.main.scrollY = Phaser.Math.Clamp(
      this.cameras.main.scrollY,
      0,
      this.#maxScrollY,
    );
  }

  #markScrollDirty() {
    this.#scrollDirty = true;
  }

  #syncMapFade() {
    this.#syncRoadMask();
    this.#syncLevelFade();
  }

  #syncLevelFade() {
    const scrollY = this.cameras.main.scrollY;

    for (const layer of this.#levelLayers) {
      layer.plate.setAlpha(this.#fadeAlpha(layer.worldY - scrollY));
    }
  }

  #syncRoadMask() {
    const mask = this.#roadMask;

    if (!mask) return;

    mask.clear();
    mask.fillStyle(0xffffff);
    mask.fillRect(0, this.cameras.main.scrollY + this.#bandTop, this.scale.width, this.#bandHeight);
  }

  #readBtnHeight(): number {
    if (!this.textures.exists(assetConf.image.btnRead)) return STAGE_BTN_READ_HEIGHT;

    return (this.textures.get(assetConf.image.btnRead).getSourceImage() as {height: number}).height;
  }

  #headerLayout() {
    const safeTop = Number(this.registry.get("safeTop")) || 0;
    const base = computeStageHeaderLayout(
      this.scale.width,
      this.scale.height,
      safeTop,
      this.#readBtnHeight(),
      "stageMap",
    );
    const heart = computeStageMapHeartLayout(
      this.scale.width,
      this.scale.height,
      safeTop,
      this.#readBtnHeight(),
    );

    return {
      ...base,
      heartSize: heart.heartSize,
      headerCenterY: heart.headerCenterY,
      marginTop: heart.marginTop,
    };
  }

  #uiFadeBands(width: number, screenH: number, mascotH: number): {top: number; bottom: number} {
    const layout = this.#headerLayout();
    const headerY = layout.headerCenterY;
    const headerBottom = headerY + layout.heartSize / 2 + layout.marginTop * 0.35;
    const top = headerBottom + PATH_FADE_TOP_EXTRA;
    const bottom = screenH - mascotH;

    return {top, bottom};
  }

  #mascotDisplayHeight(width: number, screenH: number): number {
    const key = assetConf.image.stageMascot;

    if (!this.textures.exists(key)) return screenH * 0.42;

    const frame = this.textures.get(key).getSourceImage() as {width: number; height: number};
    const maxW = width * 0.65;
    const maxH = screenH * 0.55;
    const fit = Math.min(maxW / frame.width, maxH / frame.height);

    return frame.height * fit;
  }

  #addLevelButton(
    x: number,
    y: number,
    size: number,
    localLevel: number,
    displayLevel: number,
    isOpen: boolean,
    pulse: boolean,
    map: StageMapConfig,
    revealPending = false,
  ) {
    const button = this.add.image(0, 0, assetConf.image.btnPlay);
    const buttonScale = size / button.width;

    button.setScale(buttonScale);

    const label = this.add
      .text(0, 0, `${displayLevel}`, {
        color: map.numberColor,
        fontFamily: APP_FONT,
        fontSize: `${Math.round(button.displayHeight * 0.4)}px`,
        fontStyle: "bold",
        stroke: darkenHex(map.numberColor),
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const lock = isOpen ? null : this.add.image(0, 0, assetConf.image.btnPlayBlock);

    lock?.setScale(button.displayWidth / lock.width);

    const levelContent = this.add.container(0, 0, [button, label]);

    if (!revealPending && pulse && isOpen) {
      this.#startLevelPulse(levelContent);
    }

    const stack: Phaser.GameObjects.GameObject[] = [levelContent];

    if (lock) stack.push(lock);

    const plate = this.add.container(x, y, stack).setDepth(3);

    this.#levelLayers.push({
      plate,
      worldY: y,
      levelContent,
      shouldPulse: isOpen && (pulse || revealPending),
    });

    const zone = this.add
      .zone(x, y, button.displayWidth, button.displayHeight)
      .setOrigin(0.5)
      .setDepth(12)
      .setInteractive({useHandCursor: true});

    const press = (factor: number) => plate.setScale(factor);

    zone.on("pointerdown", () => {
      if (this.#leaving || this.#unlockRevealActive) return;

      if (isOpen) playClick();
      else playNoTouch();
      press(0.92);

      this.input.once("pointerup", () => {
        if (this.#leaving || this.#panning) return;

        if (!isOpen) {
          press(1);

          return;
        }

        if (isHeartEmpty() || this.#energyPopup) {
          press(1);
          if (isHeartEmpty() && !this.#energyPopup) this.#showEnergyPopup();

          return;
        }

        this.#leaving = true;
        spendHeart();
        this.#heart?.setRemaining(getHeartRemaining());
        this.time.delayedCall(220, () => {
          this.registry.set("level", localLevel);
          this.scene.start(assetConf.scene.verse);
        });
      });
    });
  }

  #addHeader() {
    const {width} = this.scale;
    const layout = this.#headerLayout();
    const safeTop = Number(this.registry.get("safeTop")) || 0;
    const corners = computeStageMapCornerButtons(
      width,
      this.scale.height,
      safeTop,
      this.#readBtnHeight(),
    );

    const read = this.#headerButton(
      corners.insetX,
      layout.headerCenterY,
      assetConf.image.btnRead,
      corners.buttonScale,
      () => {
        playBook();
        this.scene.start(assetConf.scene.opening);
      },
    );
    const exit = this.#headerButton(
      width - corners.insetX,
      layout.headerCenterY,
      assetConf.image.btnExitGame,
      corners.buttonScale,
      () => {
        EventBus.emit(PhaserEvents.EXIT_GAME);
      },
    );

    read.setDepth(11).setScrollFactor(0);
    exit.setDepth(11).setScrollFactor(0);
    this.#headerHeartY = layout.headerCenterY;
    this.#headerHeartSize = layout.heartSize;
    this.#mountHeart();
  }

  #mountHeart() {
    if (this.#heart || this.#headerHeartSize <= 0) return;

    this.#heart = addStageHeart(this, this.scale.width / 2, this.#headerHeartY, this.#headerHeartSize);
    this.#heart?.setRemaining(getHeartRemaining());
  }

  #startLevelPulse(levelContent: Phaser.GameObjects.Container) {
    levelContent.setVisible(true);
    levelContent.setScale(1);
    this.tweens.add({
      targets: levelContent,
      scale: LEVEL_PULSE_SCALE_MUL,
      duration: LEVEL_PULSE_MS,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  #runUnlockReveal(levelIndex: number) {
    const layer = this.#levelLayers[levelIndex];

    if (!layer?.shouldPulse || !this.textures.exists(assetConf.image.btnPlayBlock)) {
      if (layer?.shouldPulse) this.#startLevelPulse(layer.levelContent);

      return;
    }

    this.#unlockRevealActive = true;

    const button = layer.levelContent.list[0] as Phaser.GameObjects.Image;
    const swayIcon = this.add.image(0, 0, assetConf.image.btnPlayBlock);

    swayIcon.setScale(button.displayWidth / swayIcon.width);
    layer.plate.add(swayIcon);
    layer.plate.bringToTop(swayIcon);

    let pulsePlayed = false;
    let unlockAnimDone = false;
    let unlockSoundDone = false;

    const tryPlayPulse = () => {
      if (pulsePlayed || !unlockAnimDone || !unlockSoundDone) return;

      pulsePlayed = true;
      playPulse();
    };

    this.#stopUnlockSfx?.();
    this.#stopUnlockSfx = playUnlocked(() => {
      unlockSoundDone = true;
      tryPlayPulse();
    });

    this.tweens.add({
      targets: swayIcon,
      x: {from: -UNLOCK_SWAY_X, to: UNLOCK_SWAY_X},
      duration: UNLOCK_SWAY_MS / 4,
      yoyo: true,
      repeat: 3,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.tweens.add({
          targets: swayIcon,
          y: UNLOCK_FALL_Y,
          alpha: 0,
          duration: UNLOCK_FALL_MS,
          ease: "Quad.easeIn",
          onComplete: () => {
            swayIcon.destroy();
            this.#unlockRevealActive = false;
            this.#stopUnlockSfx = null;
            unlockAnimDone = true;
            tryPlayPulse();
            this.#startLevelPulse(layer.levelContent);
          },
        });
      },
    });
  }

  #addMascot(width: number, screenH: number, worldH: number, map: StageMapConfig) {
    const key = assetConf.image.stageMascot;

    if (!this.textures.exists(key)) return;

    const mascot = this.add
      .image(width / 2, screenH, key)
      .setOrigin(0.5, 1)
      .setDepth(4)
      .setScrollFactor(0);
    mascot.setScale(this.#mascotDisplayHeight(width, screenH) / mascot.height);
  }

  #unbindScroll() {
    if (this.#onScrollDown) this.input.off("pointerdown", this.#onScrollDown);
    if (this.#onScrollMove) this.input.off("pointermove", this.#onScrollMove);
    if (this.#onScrollUp) this.input.off("pointerup", this.#onScrollUp);
    if (this.#onScrollWheel) this.input.off("wheel", this.#onScrollWheel);

    this.#onScrollDown = null;
    this.#onScrollMove = null;
    this.#onScrollUp = null;
    this.#onScrollWheel = null;
  }

  #bindScroll(
    width: number,
    screenH: number,
    worldH: number,
    levels: number,
    stops: {x: number; y: number}[],
    unlocked: number,
  ) {
    this.#unbindScroll();

    const maxScroll = Math.max(0, worldH - screenH);

    this.#maxScrollY = maxScroll;
    this.#scrollVelocity = 0;
    this.#lastPanDy = 0;
    const registryFocus = Number(this.registry.get("stageMapFocusLevel"));
    const focusLevel =
      Number.isFinite(registryFocus) && registryFocus >= 1
        ? registryFocus
        : Phaser.Math.Clamp(unlocked, 1, levels);

    if (Number.isFinite(registryFocus) && registryFocus >= 1) {
      this.registry.remove("stageMapFocusLevel");
    }

    const index = Phaser.Math.Clamp(focusLevel - 1, 0, Math.max(0, levels - 1));
    const stop = stops[index];
    const focusY = this.#bandTop + this.#bandHeight * 0.62;
    const scrollY = Phaser.Math.Clamp((stop?.y ?? 0) - focusY, 0, maxScroll);

    this.cameras.main.setBounds(0, 0, width, worldH);
    this.cameras.main.setScroll(0, scrollY);
    this.#clampScrollY();
    this.#syncMapFade();

    this.#onScrollDown = (pointer: Phaser.Input.Pointer) => {
      if (this.#energyPopup) return;

      this.#scrollVelocity = 0;
      this.#panFrom = pointer.y;
      this.#panning = false;
      this.#lastPanDy = 0;
    };
    this.#onScrollMove = (pointer: Phaser.Input.Pointer) => {
      if (this.#panFrom === null || !pointer.isDown || this.#energyPopup) return;

      const dy = pointer.y - this.#panFrom;

      if (!this.#panning && Math.abs(dy) < PAN_DRAG_THRESHOLD) return;

      this.#panning = true;
      this.#scrollVelocity = 0;
      this.cameras.main.scrollY -= dy;
      this.#lastPanDy = dy;
      this.#panFrom = pointer.y;
      this.#markScrollDirty();
    };
    this.#onScrollUp = () => {
      if (this.#panning) {
        this.#scrollVelocity = Phaser.Math.Clamp(
          -this.#lastPanDy * SCROLL_INERTIA_MUL,
          -SCROLL_INERTIA_MAX,
          SCROLL_INERTIA_MAX,
        );
      }

      this.#panFrom = null;
      this.time.delayedCall(30, () => {
        this.#panning = false;
      });
    };
    this.#onScrollWheel = (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      if (this.#energyPopup) return;

      this.#scrollVelocity = 0;
      this.cameras.main.scrollY += dy * SCROLL_WHEEL_FACTOR;
      this.#markScrollDirty();
    };

    this.input.on("pointerdown", this.#onScrollDown);
    this.input.on("pointermove", this.#onScrollMove);
    this.input.on("pointerup", this.#onScrollUp);
    this.input.on("wheel", this.#onScrollWheel);
  }

  #showEnergyPopup() {
    if (this.#energyPopup) return;

    const language = getCurrentLanguage();

    this.#energyPopup = showWatchAdPopup(this, {
      title: t("energyEmptyTitle", language),
      body: t("energyEmptyBody", language),
      scale: dynamicValueForViewport(this, 0.42, 0.9),
      onClose: () => {
        this.#energyPopup = null;
      },
      onWatch: () => this.#rechargeHeart(),
    });
  }

  #cancelRecharge() {
    this.#rechargeSafety?.remove();
    this.#rechargeSafety = null;

    if (this.#rechargeTween) {
      this.#rechargeTween.stop();
      this.#rechargeTween = null;
    }
  }

  #finishRechargeVisual() {
    if (!this.#recharging) return;

    this.#cancelRecharge();
    this.#heart?.setRemaining(1);
    this.#recharging = false;
  }

  #rechargeHeart() {
    refillHeart();
    playRecharge();
    if (!this.#heart) this.#mountHeart();

    this.#cancelRecharge();
    this.#recharging = true;

    if (!this.#heart) {
      this.#recharging = false;

      return;
    }

    const fill = {amount: 0.001};

    this.#heart.setRemaining(0.001);
    this.#rechargeTween = this.tweens.add({
      targets: fill,
      amount: 1,
      duration: RECHARGE_MS,
      ease: "Sine.easeInOut",
      onUpdate: () => this.#heart?.setRemaining(fill.amount),
      onComplete: () => this.#finishRechargeVisual(),
    });
    this.#rechargeSafety = this.time.delayedCall(RECHARGE_MS + 100, () => this.#finishRechargeVisual());
  }

  #headerButton(
    x: number,
    y: number,
    key: string,
    scale: number,
    onPress: () => void,
  ): Phaser.GameObjects.Image {
    const button = this.add.image(x, y, key).setOrigin(0.5).setScale(scale).setInteractive({useHandCursor: true});

    button.on("pointerdown", () => {
      playClick();
      button.setScale(scale * 0.92);
    });
    button.on("pointerup", () => {
      button.setScale(scale);
      onPress();
    });
    button.on("pointerout", () => button.setScale(scale));

    return button;
  }
}
