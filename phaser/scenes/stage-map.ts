import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {playClick, playNoTouch} from "@/settings/click";
import {isHeartEmpty, refillHeart, spendHeart} from "@/settings/heart";
import {getStageIndex, getUnlockedCount} from "@/settings/progress";
import {darkenHex, getStageMap, hexToInt, stagePoint, type StageMapConfig} from "@/settings/stage-map";
import {playTrack} from "@/settings/soundtrack";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../shared/config/layout.const";
import {addStageHeart, STAGE_HEART_SCALE, type StageHeart} from "../shared/stage-heart";
import {EventBus, PhaserEvents} from "../shared/event-bus";

const assetConf = CandyCrushAssetConf;

const LEVEL_SCALE = 0.11;
const PATH_DROP = 100;
const RECHARGE_MS = 1200;

export class StageMapScene extends Phaser.Scene {
  #heart: StageHeart | null = null;
  #energyPopup: Phaser.GameObjects.Container | null = null;
  #energyOverlay: Phaser.GameObjects.Rectangle | null = null;
  #recharging = false;
  #leaving = false;

  constructor() {
    super({key: assetConf.scene.stageMap});
  }

  create() {
    this.#leaving = false;
    const {width, height} = this.scale;
    const unlocked = getUnlockedCount();
    const map = getStageMap(getStageIndex());
    const tint = hexToInt(map.pathColor);
    const stops = Array.from({length: map.levels}, (_, index) => stagePoint(map, index));

    playTrack("stage");

    this.add
      .image(width / 2, height / 2, assetConf.image.backgroundStage)
      .setDisplaySize(width, height)
      .setDepth(0);

    this.#drawPath(width, height, map);

    stops.forEach((stop, index) => {
      const isOpen = index < unlocked;

      this.#addLevelButton(
        width * stop.x,
        height * stop.y + PATH_DROP,
        LEVEL_SCALE,
        index + 1,
        isOpen,
        isOpen && index === unlocked - 1,
        map,
        tint,
      );
    });

    this.#addHeader();
  }

  #drawPath(width: number, height: number, map: StageMapConfig) {
    const steps = Math.max(1, (map.levels - 1) * 8);
    const samples = Array.from({length: steps + 1}, (_, step) => {
      const t = (step / steps) * Math.max(1, map.levels - 1);
      const point = stagePoint(map, t);

      return new Phaser.Math.Vector2(width * point.x, height * point.y + PATH_DROP);
    });
    const stub = Math.min(width, height) * 0.03;
    const startStub = map.up ? stub : -stub;
    const path = new Phaser.Curves.Path(samples[0].x, samples[0].y + startStub);
    const last = samples[samples.length - 1];

    path.lineTo(samples[0].x, samples[0].y);
    path.splineTo(samples.slice(1));
    path.lineTo(last.x, last.y - startStub);

    const road = this.add.graphics().setDepth(1);
    const thick = Math.min(width, height) * 0.036;
    const fill = hexToInt(map.pathColor);

    road.lineStyle(thick, hexToInt(darkenHex(map.pathColor)), 1);
    path.draw(road, 256);
    road.lineStyle(thick * 0.52, fill, 1);
    path.draw(road, 256);
  }

  #addLevelButton(
    x: number,
    y: number,
    size: number,
    level: number,
    isOpen: boolean,
    pulse: boolean,
    map: StageMapConfig,
    tint: number,
  ) {
    const {width, height} = this.scale;
    const button = this.add.image(0, 0, assetConf.image.btnPlay);

    button.setScale((Math.min(width, height) * size) / button.width);

    const label = this.add
      .text(0, 0, `${level}`, {
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

    const plate = this.add
      .container(x, y, lock ? [button, label, lock] : [button, label])
      .setDepth(3);

    const zone = this.add
      .zone(x, y, button.displayWidth, button.displayHeight)
      .setOrigin(0.5)
      .setDepth(12)
      .setInteractive({useHandCursor: true});

    if (isOpen) {
      const glow = this.add
        .circle(x, y, button.displayWidth * 0.55, tint, 0.7)
        .setOrigin(0.5)
        .setDepth(2)
        .setBlendMode(Phaser.BlendModes.ADD);

      if (pulse) {
        this.tweens.add({
          targets: glow,
          alpha: 0.25,
          scale: 1.2,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    }

    const press = (factor: number) => plate.setScale(factor);

    zone.on("pointerdown", () => {
      if (this.#leaving) return;

      if (isOpen) playClick();
      else playNoTouch();
      press(0.92);

      this.input.once("pointerup", () => {
        if (this.#leaving) return;

        if (!isOpen) {
          press(1);

          return;
        }

        if (isHeartEmpty() || this.#recharging || this.#energyPopup) {
          press(1);
          if (isHeartEmpty() && !this.#recharging) this.#showEnergyPopup();

          return;
        }

        this.#leaving = true;
        spendHeart();
        this.time.delayedCall(220, () => {
          this.registry.set("level", level);
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

    read.setDepth(11);
    exit.setDepth(11);
    this.#heart = addStageHeart(this, width / 2, headerY, read.displayHeight * STAGE_HEART_SCALE);
  }

  #showEnergyPopup() {
    if (this.#energyPopup || !this.textures.exists(assetConf.image.popupExitGame)) return;

    const {width, height} = this.scale;
    const language = getCurrentLanguage();
    this.#energyOverlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
      .setDepth(40)
      .setScrollFactor(0)
      .setInteractive();
    const plate = this.add.image(0, 0, assetConf.image.popupExitGame).setOrigin(0.5);
    const wrap = plate.width * 0.62;
    const title = this.add
      .text(0, plate.height * -0.16, t("energyEmptyTitle", language), {
        fontFamily: APP_FONT,
        fontSize: "42px",
        color: "#ffd76a",
        align: "center",
        wordWrap: {width: wrap},
        stroke: "#2a160c",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    const body = this.add
      .text(0, plate.height * 0.02, t("energyEmptyBody", language), {
        fontFamily: APP_FONT,
        fontSize: "32px",
        color: "#fff8dc",
        align: "center",
        wordWrap: {width: wrap},
        stroke: "#2a160c",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    const button = this.#watchAdButton(0, plate.height * 0.24, t("watchAd", language), () => {
      this.#closeEnergyPopup();
      this.#rechargeHeart();
    });

    this.#energyOverlay.on("pointerdown", () => this.#closeEnergyPopup());

    this.#energyPopup = this.add
      .container(width / 2, height / 2, [plate, title, body, button])
      .setDepth(41)
      .setScrollFactor(0)
      .setScale(this.#gameButtonScale(0.42, 0.9));
  }

  #watchAdButton(x: number, y: number, label: string, onPress: () => void) {
    const width = 520;
    const height = 96;
    const radius = 28;
    const face = this.add.graphics();

    face.fillStyle(0x3d2614, 1);
    face.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    face.lineStyle(4, 0xa67c22, 1);
    face.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    face.lineStyle(4, 0x2a160c, 0.8);
    face.strokeRoundedRect(-width / 2 - 6, -height / 2 - 6, width + 12, height + 12, radius + 6);

    const text = this.add
      .text(0, 0, label, {
        fontFamily: APP_FONT,
        fontSize: "28px",
        color: "#fff8dc",
        align: "center",
        stroke: "#2a160c",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    const hit = this.add.rectangle(0, 0, width, height, 0xffffff, 0.001).setInteractive({useHandCursor: true});
    const plate = this.add.container(x, y, [face, text, hit]);

    hit.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      playClick();
      plate.setScale(0.95);
      this.time.delayedCall(160, () => {
        plate.setScale(1);
        onPress();
      });
    });

    return plate;
  }

  #closeEnergyPopup() {
    this.#energyPopup?.destroy(true);
    this.#energyOverlay?.destroy();
    this.#energyPopup = null;
    this.#energyOverlay = null;
  }

  #rechargeHeart() {
    if (!this.#heart || this.#recharging) return;

    this.#recharging = true;

    const fill = {amount: 0};

    this.tweens.add({
      targets: fill,
      amount: 1,
      duration: RECHARGE_MS,
      ease: "Sine.easeInOut",
      onUpdate: () => this.#heart?.setRemaining(fill.amount),
      onComplete: () => {
        this.#heart?.setRemaining(1);
        refillHeart();
        this.#recharging = false;
      },
    });
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
