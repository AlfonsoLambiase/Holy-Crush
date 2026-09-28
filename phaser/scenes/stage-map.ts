import * as Phaser from "phaser";

import {playClick, playNoTouch} from "@/settings/click";
import {getStageIndex, getUnlockedCount} from "@/settings/progress";
import {darkenHex, getStageMap, hexToInt, stagePoint, type StageMapConfig} from "@/settings/stage-map";
import {playTrack} from "@/settings/soundtrack";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../shared/config/layout.const";
import {EventBus, PhaserEvents} from "../shared/event-bus";

const assetConf = CandyCrushAssetConf;

const LEVEL_SCALE = 0.11;

export class StageMapScene extends Phaser.Scene {
  constructor() {
    super({key: assetConf.scene.stageMap});
  }

  create() {
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
        height * stop.y,
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

      return new Phaser.Math.Vector2(width * point.x, height * point.y);
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
    const button = this.add.image(x, y, assetConf.image.btnPlay).setDepth(3);

    button.setScale((Math.min(width, height) * size) / button.width);

    const label = this.add
      .text(x, y, `${level}`, {
        color: map.numberColor,
        fontFamily: APP_FONT,
        fontSize: `${Math.round(button.displayHeight * 0.4)}px`,
        fontStyle: "bold",
        stroke: darkenHex(map.numberColor),
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(4);

    const lock = isOpen ? null : this.add.image(x, y, assetConf.image.btnPlayBlock).setDepth(5);

    lock?.setScale(button.displayWidth / lock.width);

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

    button.setInteractive({useHandCursor: true});
    const restScale = button.scale;
    const restLockScale = lock?.scale ?? 1;
    const press = (factor: number) => {
      button.setScale(restScale * factor);
      label.setScale(factor);
      lock?.setScale(restLockScale * factor);
    };

    button.on("pointerdown", () => {
      if (isOpen) playClick();
      else playNoTouch();
      press(0.92);
    });
    button.on("pointerup", () => {
      press(1);
      if (isOpen) this.scene.start(assetConf.scene.verse);
    });
    button.on("pointerout", () => press(1));
  }

  #addHeader() {
    const {width} = this.scale;
    const safeTop = Number(this.registry.get("safeTop")) || 0;
    const inset = this.#gameButtonScale(HEADER_INSET_MIN, HEADER_INSET_MAX);
    const logoScale = this.#gameButtonScale(0.4, 1);
    const margin = 40 * logoScale;
    const logo = this.textures.exists("logo_stage")
      ? (this.textures.get("logo_stage").getSourceImage() as {height: number})
      : null;
    const headerY = logo
      ? safeTop + margin + (logo.height * logoScale) / 2
      : safeTop + inset;
    const scale = this.#gameButtonScale(0.35, 1);

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

    read.setDepth(10);
    exit.setDepth(10);
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
