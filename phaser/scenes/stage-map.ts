import * as Phaser from "phaser";

import {playTrack} from "@/settings/soundtrack";
import {getUnlockedCount} from "@/settings/progress";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../shared/config/layout.const";
import {EventBus, PhaserEvents} from "../shared/event-bus";

const assetConf = CandyCrushAssetConf;

//* Sul tracciato, dal più vicino (basso, grande) al più lontano (alto, piccolo)
const STOPS = [
  {x: 0.65, y: 0.84},
  {x: 0.17, y: 0.67},
  {x: 0.62, y: 0.46},
  {x: 0.19, y: 0.29},
  {x: 0.47, y: 0.13},
] as const;

const NEAR_SCALE = 0.15;
const FAR_SCALE = 0.11;

export class StageMapScene extends Phaser.Scene {
  constructor() {
    super({key: assetConf.scene.stageMap});
  }

  create() {
    const {width, height} = this.scale;
    const unlocked = getUnlockedCount();

    playTrack("stage");

    this.add
      .image(width / 2, height / 2, assetConf.image.backgroundStage)
      .setDisplaySize(width, height)
      .setDepth(0);

    this.add
      .image(width / 2, height / 2, assetConf.image.road)
      .setDisplaySize(width, height)
      .setDepth(1);

    STOPS.forEach((stop, index) => {
      const isOpen = index < unlocked;
      const depth = (index + 1) / (STOPS.length - 1);
      const size = NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * depth;
      const x = width * stop.x;
      const y = height * stop.y;

      this.#addLevelButton(x, y, size, isOpen, isOpen && index === unlocked - 1);
    });

    this.#addHeader();
  }

  #addLevelButton(x: number, y: number, size: number, isOpen: boolean, pulse: boolean) {
    const {width, height} = this.scale;
    const color = isOpen ? 0xfff4c2 : 0xb388ff;
    const button = this.add
      .image(x, y, isOpen ? assetConf.image.btnPlay : assetConf.image.btnPlayBlock)
      .setDepth(3);

    button.setScale((Math.min(width, height) * size) / button.width);

    const glow = this.add
      .circle(x, y, button.displayWidth * 0.55, color, 0.7)
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

    if (!isOpen) return;

    button.setInteractive({useHandCursor: true});
    const restScale = button.scale;

    button.on("pointerdown", () => button.setScale(restScale * 0.92));
    button.on("pointerup", () => {
      button.setScale(restScale);
      this.scene.start(assetConf.scene.verse);
    });
    button.on("pointerout", () => button.setScale(restScale));
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

    button.on("pointerdown", () => button.setScale(scale * 0.92));
    button.on("pointerup", () => {
      button.setScale(scale);
      onPress();
    });
    button.on("pointerout", () => button.setScale(scale));

    return button;
  }
}
