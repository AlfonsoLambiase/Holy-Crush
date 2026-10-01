import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {playClick, playNoTouch, playRecharge} from "@/settings/click";
import {getHeartRemaining, isHeartEmpty, refillHeart, spendHeart} from "@/settings/heart";
import {getStageIndex, getUnlockedCount} from "@/settings/progress";
import {darkenHex, getStageLevelNumber, getStageMap, hexToInt, stagePoint, type StageMapConfig} from "@/settings/stage-map";
import {playTrack} from "@/settings/soundtrack";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../shared/config/layout.const";
import {addStageHeart, STAGE_HEART_SCALE, type StageHeart} from "../shared/stage-heart";
import {EventBus, PhaserEvents} from "../shared/event-bus";
import {showWatchAdPopup, type WatchAdPopup} from "../shared/watch-ad-popup";

const assetConf = CandyCrushAssetConf;

const LEVEL_SCALE = 0.11;
const LEVEL_GAP = 0.18; // quota di schermo tra un livello e il successivo
const RECHARGE_MS = 1200;
const PATH_FADE_ALPHA = 0.1;
const PATH_FADE_PX = 56;
const PATH_FADE_TOP_EXTRA = 58;
const PATH_STUB_LOW = 0.35;
const PATH_CURVE_DIVISIONS = 512;

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
  #pathGfx: Phaser.GameObjects.Graphics | null = null;
  #pathPoints: Phaser.Math.Vector2[] = [];
  #pathStyle: {thick: number; fill: number; edge: number} | null = null;
  #fadeTop = 0;
  #fadeBottom = 0;
  #levelLayers: {plate: Phaser.GameObjects.Container; worldY: number}[] = [];
  #onScrollDown: ((pointer: Phaser.Input.Pointer) => void) | null = null;
  #onScrollMove: ((pointer: Phaser.Input.Pointer) => void) | null = null;
  #onScrollUp: (() => void) | null = null;
  #onScrollWheel: ((pointer: Phaser.Input.Pointer, over: unknown, dx: number, dy: number) => void) | null = null;

  constructor() {
    super({key: assetConf.scene.stageMap});
  }

  shutdown() {
    this.#unbindScroll();
    this.#cancelRecharge();
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
    const tint = hexToInt(map.pathColor);
    const worldH = this.#worldHeight(height, map.levels);
    const mascotH = this.#mascotDisplayHeight(width, height);
    const pathBottom = 1 - mascotH / worldH;
    const stops = Array.from({length: map.levels}, (_, index) => stagePoint(map, index, pathBottom));

    playTrack("stage");

    this.add
      .image(width / 2, height / 2, assetConf.image.backgroundStage)
      .setDisplaySize(width, height)
      .setDepth(0)
      .setScrollFactor(0);

    const fade = this.#uiFadeBands(width, height, mascotH);

    this.#fadeTop = fade.top;
    this.#fadeBottom = fade.bottom;
    this.#addMascot(width, height, worldH, map);
    this.#drawPath(width, worldH, map, pathBottom);

    stops.forEach((stop, index) => {
      const isOpen = index < unlocked;

      this.#addLevelButton(
        width * stop.x,
        worldH * stop.y,
        LEVEL_SCALE,
        index + 1,
        getStageLevelNumber(stage, index),
        isOpen,
        isOpen && index === unlocked - 1,
        map,
        tint,
      );
    });

    this.#addHeader();
    this.#bindScroll(width, height, worldH, map, pathBottom, unlocked);
  }

  #worldHeight(screenH: number, levels: number): number {
    return screenH * (0.26 + Math.max(1, levels - 1) * LEVEL_GAP + 0.16);
  }

  #drawPath(width: number, worldH: number, map: StageMapConfig, pathBottom: number) {
    const steps = Math.max(1, (map.levels - 1) * 8);
    const samples = Array.from({length: steps + 1}, (_, step) => {
      const t = (step / steps) * Math.max(1, map.levels - 1);
      const point = stagePoint(map, t, pathBottom);

      return new Phaser.Math.Vector2(width * point.x, worldH * point.y);
    });
    const stub = Math.min(width, this.scale.height) * 0.03;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const thick = Math.min(width, this.scale.height) * 0.036;
    const curve = new Phaser.Curves.Path(first.x, first.y + stub * PATH_STUB_LOW);

    curve.lineTo(first.x, first.y);
    curve.splineTo(samples.slice(1));
    curve.lineTo(last.x, last.y - stub);

    this.#pathPoints = curve.getPoints(PATH_CURVE_DIVISIONS).map((point) => point.clone());
    this.#pathStyle = {
      thick,
      fill: hexToInt(map.pathColor),
      edge: hexToInt(darkenHex(map.pathColor)),
    };
    this.#pathGfx = this.add.graphics().setDepth(2);
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

  #syncMapFade() {
    this.#paintPath();
    this.#syncLevelFade();
  }

  #syncLevelFade() {
    const scrollY = this.cameras.main.scrollY;

    for (const layer of this.#levelLayers) {
      layer.plate.setAlpha(this.#fadeAlpha(layer.worldY - scrollY));
    }
  }

  #paintPath() {
    const road = this.#pathGfx;
    const style = this.#pathStyle;
    const points = this.#pathPoints;

    if (!road || !style || points.length < 2) return;

    const scrollY = this.cameras.main.scrollY;

    road.clear();

    for (let index = 0; index < points.length - 1; index += 1) {
      const from = points[index];
      const to = points[index + 1];
      const screenY = (from.y + to.y) * 0.5 - scrollY;
      const alpha = this.#fadeAlpha(screenY);

      road.lineStyle(style.thick, style.edge, alpha);
      road.lineBetween(from.x, from.y, to.x, to.y);
      road.lineStyle(style.thick * 0.52, style.fill, alpha);
      road.lineBetween(from.x, from.y, to.x, to.y);
    }
  }

  #uiFadeBands(width: number, screenH: number, mascotH: number): {top: number; bottom: number} {
    const safeTop = Number(this.registry.get("safeTop")) || 0;
    const scale = this.#gameButtonScale(0.35, 1);
    const readImage = this.textures.exists(assetConf.image.btnRead)
      ? (this.textures.get(assetConf.image.btnRead).getSourceImage() as {height: number})
      : null;
    const heartSize = (readImage?.height ?? 0) * scale * STAGE_HEART_SCALE;
    const margin = 40 * this.#gameButtonScale(0.4, 1);
    const headerY = safeTop + margin + heartSize / 2;
    const headerBottom = headerY + heartSize / 2 + margin * 0.35;
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
    tint: number,
  ) {
    const {width, height} = this.scale;
    const button = this.add.image(0, 0, assetConf.image.btnPlay);

    button.setScale((Math.min(width, height) * size) / button.width);

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

    const stack: Phaser.GameObjects.GameObject[] = [];

    if (isOpen) {
      const glow = this.add
        .circle(0, 0, button.displayWidth * 0.55, tint, 0.7)
        .setBlendMode(Phaser.BlendModes.ADD);

      stack.push(glow);

      if (pulse) {
        this.tweens.add({
          targets: glow,
          scale: 1.2,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    }

    stack.push(button, label);
    if (lock) stack.push(lock);

    const plate = this.add.container(x, y, stack).setDepth(3);

    this.#levelLayers.push({plate, worldY: y});

    const zone = this.add
      .zone(x, y, button.displayWidth, button.displayHeight)
      .setOrigin(0.5)
      .setDepth(12)
      .setInteractive({useHandCursor: true});

    const press = (factor: number) => plate.setScale(factor);

    zone.on("pointerdown", () => {
      if (this.#leaving) return;

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
    const safeTop = Number(this.registry.get("safeTop")) || 0;
    const inset = this.#gameButtonScale(HEADER_INSET_MIN, HEADER_INSET_MAX);
    const scale = this.#gameButtonScale(0.35, 1);
    const readImage = this.textures.exists(assetConf.image.btnRead)
      ? (this.textures.get(assetConf.image.btnRead).getSourceImage() as {height: number})
      : null;
    const heartSize = (readImage?.height ?? 0) * scale * STAGE_HEART_SCALE;
    const margin = 40 * this.#gameButtonScale(0.4, 1);
    const headerY = safeTop + margin + heartSize / 2;

    const read = this.#headerButton(inset, headerY, assetConf.image.btnRead, scale, () => {
      this.scene.start(assetConf.scene.opening);
    });
    const exit = this.#headerButton(
      width - inset,
      headerY,
      assetConf.image.btnExitGame,
      scale,
      () => {
        EventBus.emit(PhaserEvents.EXIT_GAME);
      },
    );

    read.setDepth(11).setScrollFactor(0);
    exit.setDepth(11).setScrollFactor(0);
    this.#headerHeartY = headerY;
    this.#headerHeartSize = heartSize;
    this.#mountHeart();
  }

  #mountHeart() {
    if (this.#heart || this.#headerHeartSize <= 0) return;

    this.#heart = addStageHeart(this, this.scale.width / 2, this.#headerHeartY, this.#headerHeartSize);
    this.#heart?.setRemaining(getHeartRemaining());
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
    map: StageMapConfig,
    pathBottom: number,
    unlocked: number,
  ) {
    this.#unbindScroll();

    const maxScroll = Math.max(0, worldH - screenH);
    const registryFocus = Number(this.registry.get("stageMapFocusLevel"));
    const focusLevel =
      Number.isFinite(registryFocus) && registryFocus >= 1
        ? registryFocus
        : Phaser.Math.Clamp(unlocked, 1, map.levels);

    if (Number.isFinite(registryFocus) && registryFocus >= 1) {
      this.registry.remove("stageMapFocusLevel");
    }

    const index = Phaser.Math.Clamp(focusLevel - 1, 0, map.levels - 1);
    const stop = stagePoint(map, index, pathBottom);
    const scrollY = Phaser.Math.Clamp(worldH * stop.y - screenH * 0.42, 0, maxScroll);

    this.cameras.main.setBounds(0, 0, width, worldH);
    this.cameras.main.setScroll(0, scrollY);
    this.#syncMapFade();

    this.#onScrollDown = (pointer: Phaser.Input.Pointer) => {
      if (this.#energyPopup) return;

      this.#panFrom = pointer.y;
      this.#panning = false;
    };
    this.#onScrollMove = (pointer: Phaser.Input.Pointer) => {
      if (this.#panFrom === null || !pointer.isDown || this.#energyPopup) return;

      const dy = pointer.y - this.#panFrom;

      if (!this.#panning && Math.abs(dy) < 12) return;

      this.#panning = true;
      this.cameras.main.scrollY -= dy;
      this.#panFrom = pointer.y;
      this.#syncMapFade();
    };
    this.#onScrollUp = () => {
      this.#panFrom = null;
      this.time.delayedCall(30, () => {
        this.#panning = false;
      });
    };
    this.#onScrollWheel = (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      if (this.#energyPopup) return;

      this.cameras.main.scrollY += dy * 0.6;
      this.#syncMapFade();
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
      scale: this.#gameButtonScale(0.42, 0.9),
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

  //* Stessa scala del bottone esci dentro la partita
  #gameButtonScale(minValue: number, maxValue: number): number {
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    const config = this.sys.game.config as {width: number; height: number};
    const calculated = Math.min(config.width / 1080, config.height / 1920);
    let globalScale = Phaser.Math.Clamp(calculated, 0.59, 1.2);
    const isBigScreen = cssWidth * pixelRatio >= 2500 || cssHeight * pixelRatio >= 1400;

    if (!isBigScreen && cssWidth < 750 && cssHeight < 450) globalScale *= 0.7;
    if (globalScale >= 1) return maxValue;
    if (globalScale <= 0.5) return minValue;

    const t = (globalScale - 0.5) / 0.5;

    return minValue + t * (maxValue - minValue);
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
