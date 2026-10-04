/* eslint-disable @typescript-eslint/no-unused-vars */
import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {phaserImageScale, resolveHeaderMetrics} from "@/settings/app-header-layout";
import {BTN_READ_NATIVE_HEIGHT} from "@/settings/app-header-tokens";
import {playClick} from "@/settings/click";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {animatePopupClose, animatePopupOpen} from "../shared/popup-motion";
import {dynamicValueForViewport} from "../shared/viewport-scale";

import {Game} from "./game";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

const BUTTON_GAP_MIN = 26;
const BUTTON_GAP_MAX = 48;
const TITLE_Y_RATIO = -0.22;
const TITLE_FONT_MIN = 64;
const TITLE_FONT_MAX = 82;
const CHOICE_ROW_Y_RATIO = 0.16;
const PRESS_MS = 220; // stessa attesa del premuto sugli altri bottoni
const PRESS_SCALE = 0.92;

type PopupMode = "exit" | "reload";

export class ExitManager extends Phaser.Scene {
  private width!: number;
  private height!: number;

  private backgroundOverlay!: Phaser.GameObjects.Graphics;
  private outsideDismiss!: Phaser.GameObjects.Rectangle;
  private popupContainer!: Phaser.GameObjects.Container;
  private popupPanel!: Phaser.GameObjects.Image;
  private titleText!: Phaser.GameObjects.Text;

  gameScene!: Game;
  private choiceLocked = false;
  #dismissReady = false;
  #mode: PopupMode = "exit";
  #popupBaseScale = 1;
  #closing = false;
  #btnConfirm!: Phaser.GameObjects.Image;
  #btnCancel!: Phaser.GameObjects.Image;
  #confirmPlate!: Phaser.GameObjects.Container;
  #cancelPlate!: Phaser.GameObjects.Container;

  constructor(scene?: Phaser.Scene) {
    super({key: assetConf.scene.exitManager});
    this.gameScene = scene as Game;
  }

  init(data?: {popupMode?: PopupMode}) {
    if (data?.popupMode) this.#mode = data.popupMode;
  }

  create() {
    const config = this.sys.game.config as {width: number; height: number};

    this.height = config.height;
    this.width = config.width;

    if (this.scene.isActive(assetConf.scene.game)) {
      this.scene.pause(assetConf.scene.game);
      this.sound.pauseAll();
    }

    this.#addBackgroundOverlay();
    this.#addPopup();
    this.showPopup(this.#mode);
  }

  public setGameScene(scene: Game): void {
    this.gameScene = scene;
  }

  #scaleOf(minValue: number, maxValue: number): number {
    if (this.gameScene?.setDynamicValueBasedOnScale) {
      return this.gameScene.setDynamicValueBasedOnScale(minValue, maxValue);
    }

    return dynamicValueForViewport(this, minValue, maxValue);
  }

  #cornerButtonLocalHeight(): number {
    const safeTop = Number(this.registry.get("safeTop")) || 0;
    const metrics = resolveHeaderMetrics(
      "inGame",
      this.width,
      this.height,
      safeTop,
      BTN_READ_NATIVE_HEIGHT,
    );

    return metrics.cornerButtonPhysical / Math.max(this.#popupBaseScale, 0.01);
  }

  #layoutChoiceButtons() {
    if (!this.#btnConfirm || !this.#confirmPlate || !this.#cancelPlate || !this.popupPanel) return;

    const panelH = this.popupPanel.height;
    const rowY = panelH * CHOICE_ROW_Y_RATIO;
    const gap = this.#scaleOf(BUTTON_GAP_MIN, BUTTON_GAP_MAX);
    const targetH = this.#cornerButtonLocalHeight();
    const confirmNative = this.textures
      .get(assetConf.image.btnConfirm)
      .getSourceImage() as {width: number; height: number};
    const cancelNative = this.textures
      .get(assetConf.image.btnCancel)
      .getSourceImage() as {width: number; height: number};
    const confirmScale = phaserImageScale(confirmNative.height, targetH);
    const cancelScale = phaserImageScale(cancelNative.height, targetH);

    this.#btnConfirm.setScale(confirmScale);
    this.#btnCancel.setScale(cancelScale);

    const confirmW = confirmNative.width * confirmScale;
    const cancelW = cancelNative.width * cancelScale;
    const rowW = cancelW + gap + confirmW;

    this.#cancelPlate.setPosition(-rowW / 2 + cancelW / 2, rowY);
    this.#confirmPlate.setPosition(rowW / 2 - confirmW / 2, rowY);
  }

  #addBackgroundOverlay() {
    this.backgroundOverlay = this.add.graphics();
    this.backgroundOverlay.fillStyle(0x000000, 0.5);
    this.backgroundOverlay.fillRect(0, 0, this.width, this.height);
    this.backgroundOverlay.setDepth(100);

    this.outsideDismiss = this.add
      .rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x000000, 0.001)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive({useHandCursor: false});

    this.outsideDismiss.on("pointerup", () => {
      if (!this.#dismissReady || !this.popupContainer?.visible || this.choiceLocked) return;

      this.#resumeGame();
    });
  }

  #addPopup() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.#popupBaseScale = this.#scaleOf(0.4, 0.95);
    this.popupContainer = this.add
      .container(centerX, centerY)
      .setDepth(101)
      .setScrollFactor(0)
      .setScale(this.#popupBaseScale);

    // Load popup background image
    const language = getCurrentLanguage();
    this.popupPanel = this.add
      .image(0, 0, assetConf.image.popupExitGame)
      .setOrigin(0.5)
      .setDepth(101);

    this.titleText = this.#addLabel(
      0,
      this.popupPanel.height * TITLE_Y_RATIO,
      t("exitTitle", language),
      {
        fontSize: this.#scaleOf(TITLE_FONT_MIN, TITLE_FONT_MAX),
        color: "#ffd76a",
        wordWrapWidth: this.popupPanel.width * 0.78,
      },
    );

    this.#btnCancel = this.add
      .image(0, 0, assetConf.image.btnCancel)
      .setOrigin(0.5)
      .setInteractive({useHandCursor: true});
    this.#btnConfirm = this.add
      .image(0, 0, assetConf.image.btnConfirm)
      .setOrigin(0.5)
      .setInteractive({useHandCursor: true});

    this.#confirmPlate = this.#choicePlate(this.#btnConfirm, () => this.#confirmChoice());
    this.#cancelPlate = this.#choicePlate(this.#btnCancel, () => this.#resumeGame());
    this.#layoutChoiceButtons();

    this.popupContainer.add([this.popupPanel, this.titleText, this.#confirmPlate, this.#cancelPlate]);
  }

  #choicePlate(button: Phaser.GameObjects.Image, onPress: () => void) {
    const plate = this.add.container(0, 0, [button]);

    button.on("pointerdown", () => {
      if (this.choiceLocked) return;

      this.choiceLocked = true;
      playClick();
      plate.setScale(PRESS_SCALE);
      this.time.delayedCall(PRESS_MS, () => {
        plate.setScale(1);
        onPress();
      });
    });

    return plate;
  }

  #hidePopup() {
    this.backgroundOverlay.setVisible(false);
    this.popupContainer.setVisible(false);
    this.outsideDismiss.disableInteractive();
  }

  #closePopupAnimated(onDone: () => void) {
    if (this.#closing) return;

    this.#closing = true;
    this.#dismissReady = false;
    this.outsideDismiss.disableInteractive();
    animatePopupClose(this, this.popupContainer, this.#popupBaseScale, this.backgroundOverlay, () => {
      this.#closing = false;
      this.#hidePopup();
      onDone();
    });
  }

  #resumeGame() {
    this.#closePopupAnimated(() => {
      this.choiceLocked = false;

      if (this.scene.isPaused(assetConf.scene.game)) {
        this.scene.resume(assetConf.scene.game);
      }

      this.sound.resumeAll();
    });
  }

  #confirmChoice() {
    this.#closePopupAnimated(() => {
      if (this.#mode === "reload") {
        this.#restartMatch();

        return;
      }

      this.#backToStage();
    });
  }

  #backToStage() {
    const game = this.scene.get(assetConf.scene.game) as Game;

    game?.theme?.stop();
    this.sound.resumeAll();
    this.scene.stop(assetConf.scene.gameManager);
    this.scene.stop(assetConf.scene.timerManager);
    this.scene.stop(assetConf.scene.game);
    this.scene.start(assetConf.scene.stageMap);
  }

  #restartMatch() {
    this.sound.resumeAll();
    this.scene.stop(assetConf.scene.gameManager);
    this.scene.stop(assetConf.scene.timerManager);
    this.scene.stop(assetConf.scene.exitManager);
    this.scene.stop(assetConf.scene.game);
    this.scene.start(assetConf.scene.game);
  }

  #addLabel(
    x: number,
    y: number,
    text: string,
    {fontSize, color, wordWrapWidth}: {fontSize: number; color: string; wordWrapWidth?: number},
  ) {
    return this.add
      .text(x, y, text, {
        fontFamily: APP_FONT,
        fontSize: `${fontSize}px`,
        color,
        align: "center",
        wordWrap: wordWrapWidth ? {width: wordWrapWidth} : undefined,
        stroke: "#3d2614",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(103);
  }

  showPopup(mode: PopupMode = "exit") {
    this.#mode = mode;
    this.#popupBaseScale = this.#scaleOf(0.4, 0.95);
    this.#layoutChoiceButtons();
    this.titleText?.setText(
      t(this.#mode === "reload" ? "reloadTitle" : "exitTitle", getCurrentLanguage()),
    );
    this.titleText?.setFontSize(`${this.#scaleOf(TITLE_FONT_MIN, TITLE_FONT_MAX)}px`);
    this.titleText?.setWordWrapWidth(this.popupPanel.width * 0.78);
    this.choiceLocked = false;
    this.#dismissReady = false;
    this.#closing = false;
    this.backgroundOverlay?.setVisible(true);
    this.popupContainer?.setVisible(true);
    this.outsideDismiss.setInteractive({useHandCursor: false});
    this.popupContainer?.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Container) child.setScale(1);
    });
    animatePopupOpen(this, this.popupContainer, this.#popupBaseScale, this.backgroundOverlay, 0.5);
    this.time.delayedCall(120, () => {
      this.#dismissReady = true;
    });
  }

  openPopup(scene: Phaser.Scene, mode: PopupMode) {
    const manager = scene.scene.get(assetConf.scene.exitManager) as ExitManager;
    const running = scene.scene.isActive(assetConf.scene.exitManager);

    scene.scene.pause(assetConf.scene.game);
    scene.sound.pauseAll();

    if (!running) {
      scene.scene.launch(assetConf.scene.exitManager, {popupMode: mode});
    } else {
      scene.scene.wake(assetConf.scene.exitManager);
      manager.showPopup(mode);
    }
  }

}
