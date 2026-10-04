import * as Phaser from "phaser";

import {playClick} from "@/settings/click";
import {isEffectsEnabled, setEffectsEnabled} from "@/settings/effects";
import {isMusicEnabled, setMusicEnabled} from "@/settings/music";
import {phaserImageScale} from "@/settings/app-header-layout";
import {playTrack, stopTrack} from "@/settings/soundtrack";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {EventBus, PhaserEvents} from "../shared/event-bus";
import {POPUP_OPEN_MS} from "../shared/popup-motion";

import {ExitManager} from "../scenes/exit-manager";
import type {Game} from "../scenes/game";

const assetConf = CandyCrushAssetConf;

const DEPTH_OVERLAY = 44;
const DEPTH_DISMISS = 45;
const DEPTH_STACK = 46;
const OPEN_MS = POPUP_OPEN_MS;
const OVERLAY_ALPHA = 0.72;
const STACK_GAP_MIN = 6;
const STACK_GAP_MAX = 14;
const PRESS_MS = 220;
const PRESS_SCALE = 0.92;

type StackButton = {
  plate: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  restY: number;
};

export class GameSettingsMenu {
  #open = false;
  #busy = false;
  #anchorX = 0;
  #anchorY = 0;
  #buttonDisplayHeight = 0;
  #overlay!: Phaser.GameObjects.Rectangle;
  #dismiss!: Phaser.GameObjects.Rectangle;
  #settingsBtn!: Phaser.GameObjects.Image;
  #stack: StackButton[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly scaleOf: (min: number, max: number) => number,
    private readonly gameScene: Game,
  ) {}

  isOpen(): boolean {
    return this.#open;
  }

  isBlocking(): boolean {
    return this.#open || this.#busy;
  }

  create(settingsX: number, settingsY: number, buttonDisplayHeight: number): void {
    const settingsKey = assetConf.image.settingsHome;

    if (!this.scene.textures.exists(settingsKey)) return;

    this.#anchorX = settingsX;
    this.#anchorY = settingsY;
    this.#buttonDisplayHeight = buttonDisplayHeight;

    const settingsNative = this.scene.textures.get(settingsKey).getSourceImage() as {height: number};
    const settingsScale = phaserImageScale(settingsNative.height, buttonDisplayHeight);

    this.#settingsBtn = this.scene.add
      .image(settingsX, settingsY, settingsKey)
      .setScrollFactor(0)
      .setDepth(14)
      .setScale(settingsScale)
      .setInteractive({useHandCursor: true});

    this.#settingsBtn.on("pointerdown", () => {
      if (this.#busy) return;

      playClick();

      if (this.#open) this.#close();
      else this.#openMenu();
    });

    const {width, height} = this.scene.scale;

    this.#overlay = this.scene.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, OVERLAY_ALPHA)
      .setScrollFactor(0)
      .setDepth(DEPTH_OVERLAY)
      .setAlpha(0)
      .setVisible(false);

    this.#dismiss = this.scene.add
      .rectangle(width / 2, height / 2, width, height, 0xffffff, 0.001)
      .setScrollFactor(0)
      .setDepth(DEPTH_DISMISS)
      .setVisible(false);

    this.#dismiss.on("pointerup", () => {
      if (!this.#open || this.#busy) return;

      this.#close();
    });

    this.#buildStack();
  }

  #buildStack() {
    const soundKey = assetConf.image.btnSound;
    const reloadKey = assetConf.image.btnReload;
    const exitKey = assetConf.image.btnExitGame;

    if (
      !this.scene.textures.exists(soundKey) ||
      !this.scene.textures.exists(reloadKey) ||
      !this.scene.textures.exists(exitKey)
    ) {
      return;
    }

    const step = this.#buttonDisplayHeight + this.scaleOf(STACK_GAP_MIN, STACK_GAP_MAX);
    const exitY = this.#anchorY - step;
    const reloadY = exitY - step;
    const soundY = reloadY - step;

    const sound = this.#makeStackButton(soundY, this.#soundTexture(), () => this.#toggleSound());
    const reload = this.#makeStackButton(reloadY, reloadKey, () => this.#openReload());
    const exit = this.#makeStackButton(exitY, exitKey, () => this.#openExit());

    this.#stack = [sound, reload, exit];

    for (const item of this.#stack) {
      item.plate.setPosition(this.#anchorX, this.#anchorY);
      item.plate.setAlpha(0);
      item.plate.setVisible(false);
      item.plate.setDepth(DEPTH_STACK);
      item.plate.setScrollFactor(0);
    }

  }

  #soundTexture(): string {
    return isMusicEnabled() && isEffectsEnabled()
      ? assetConf.image.btnSound
      : assetConf.image.btnNoSound;
  }

  #textureScale(texture: string): number {
    const native = this.scene.textures.get(texture).getSourceImage() as {height: number};

    return phaserImageScale(native.height, this.#buttonDisplayHeight);
  }

  #makeStackButton(restY: number, texture: string, onPress: () => void): StackButton {
    const image = this.scene.add
      .image(0, 0, texture)
      .setOrigin(0.5)
      .setScale(this.#textureScale(texture))
      .setInteractive({useHandCursor: true});
    const plate = this.scene.add.container(this.#anchorX, this.#anchorY, [image]);

    image.on("pointerdown", () => {
      if (this.#busy || !this.#open) return;

      this.#busy = true;
      playClick();
      plate.setScale(PRESS_SCALE);
      this.scene.time.delayedCall(PRESS_MS, () => {
        plate.setScale(1);
        this.#busy = false;
        onPress();
      });
    });

    return {plate, image, restY};
  }

  #toggleSound() {
    const enabled = isMusicEnabled() && isEffectsEnabled();

    if (enabled) {
      setMusicEnabled(false);
      setEffectsEnabled(false);
      stopTrack();
    } else {
      setMusicEnabled(true);
      setEffectsEnabled(true);
      playTrack("game");
    }

    const soundTexture = this.#soundTexture();

    this.#stack[0]?.image.setTexture(soundTexture);
    this.#stack[0]?.image.setScale(this.#textureScale(soundTexture));
  }

  #openReload() {
    if (this.scene.registry.get("test")) {
      return;
    }

    this.#close(() => this.#exitManager().openPopup(this.scene, "reload"));
  }

  #openExit() {
    const isTesting: boolean = this.scene.registry.get("test");
    const theme = this.gameScene.theme;

    this.#close(() => {
      if (isTesting) {
        theme?.stop();
        EventBus.emit(PhaserEvents.EXIT_GAME);

        return;
      }

      this.#exitManager().openPopup(this.scene, "exit");
    });
  }

  #exitManager(): ExitManager {
    return this.scene.scene.get(assetConf.scene.exitManager) as ExitManager;
  }

  #openMenu() {
    if (!this.#stack.length) return;

    this.#open = true;
    this.#settingsBtn.setDepth(DEPTH_STACK + 2);
    const {width, height} = this.scene.scale;

    this.#overlay.setSize(width, height).setPosition(width / 2, height / 2);
    this.#dismiss.setSize(width, height).setPosition(width / 2, height / 2);
    this.#overlay.setVisible(true);
    this.#dismiss.setVisible(true).setInteractive({useHandCursor: false});

    this.scene.tweens.add({
      targets: this.#overlay,
      alpha: OVERLAY_ALPHA,
      duration: OPEN_MS,
      ease: "Sine.easeOut",
    });

    this.#stack.forEach((item, index) => {
      item.plate.setVisible(true);
      item.plate.setPosition(this.#anchorX, this.#anchorY);
      item.plate.setAlpha(0);

      this.scene.tweens.add({
        targets: item.plate,
        y: item.restY,
        alpha: 1,
        duration: OPEN_MS,
        delay: index * 45,
        ease: "Back.easeOut",
      });
    });

    this.scene.tweens.add({
      targets: this.#settingsBtn,
      scale: this.#settingsBtn.scale * 1.04,
      duration: OPEN_MS,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  #close(onDone?: () => void) {
    if (!this.#open) {
      onDone?.();

      return;
    }

    this.#open = false;
    this.#settingsBtn.setDepth(14);
    this.#dismiss.disableInteractive();

    this.scene.tweens.add({
      targets: this.#overlay,
      alpha: 0,
      duration: OPEN_MS * 0.8,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.#overlay.setVisible(false);
      },
    });

    let pending = this.#stack.length;
    const finishOne = () => {
      pending -= 1;

      if (pending <= 0) {
        this.#dismiss.setVisible(false);
        onDone?.();
      }
    };

    if (!this.#stack.length) {
      onDone?.();

      return;
    }

    this.#stack.forEach((item, index) => {
      this.scene.tweens.add({
        targets: item.plate,
        y: this.#anchorY,
        alpha: 0,
        duration: OPEN_MS * 0.75,
        delay: index * 30,
        ease: "Sine.easeIn",
        onComplete: () => {
          item.plate.setVisible(false);
          finishOne();
        },
      });
    });
  }
}
