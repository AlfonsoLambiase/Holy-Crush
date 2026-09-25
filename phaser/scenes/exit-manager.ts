/* eslint-disable @typescript-eslint/no-unused-vars */
import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../shared/config/layout.const";
import {EventBus, PhaserEvents} from "../shared/event-bus";

import {Game} from "./game";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

const BUTTON_GAP = 40; // spazio verticale fra conferma e annulla
const BUTTONS_CENTER_Y = 70; // centro della coppia bottoni (positivo = più in basso)
const TITLE_Y_RATIO = -0.22; // titolo nella parte alta del pannello

export class ExitManager extends Phaser.Scene {
  private width!: number;
  private height!: number;

  private backgroundOverlay!: Phaser.GameObjects.Graphics;
  private popupContainer!: Phaser.GameObjects.Container;

  gameScene!: Game;

  constructor(scene?: Phaser.Scene) {
    super({key: assetConf.scene.exitManager});
    this.gameScene = scene as Game;
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
  }

  public setGameScene(scene: Game): void {
    this.gameScene = scene;
  }

  #addBackgroundOverlay() {
    this.backgroundOverlay = this.add.graphics();
    this.backgroundOverlay.fillStyle(0x000000, 0.5);
    this.backgroundOverlay.fillRect(0, 0, this.width, this.height);
    this.backgroundOverlay.setDepth(100);
  }

  #addPopup() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.popupContainer = this.add
      .container(centerX, centerY)
      .setDepth(101)
      .setScrollFactor(0)
      .setScale(this.gameScene.setDynamicValueBasedOnScale(0.4, 0.95));

    // Load popup background image
    const language = getCurrentLanguage();
    const popupExitGame = this.add
      .image(0, 0, assetConf.image.popupExitGame)
      .setOrigin(0.5)
      .setDepth(101);

    const title = this.#addLabel(0, popupExitGame.height * TITLE_Y_RATIO, t("exitTitle", language), {
      fontSize: 46,
      color: "#ffd76a",
      wordWrapWidth: popupExitGame.width * 0.72,
    });

    // Cancel button
    const btnCancel = this.add
      .image(0, 0, assetConf.image.btnCancel)
      .setOrigin(0.5)
      .setDepth(102)
      .setInteractive({useHandCursor: true});

    btnCancel.on("pointerdown", () => {
      this.backgroundOverlay.setVisible(false);
      this.popupContainer.setVisible(false);

      if (!this.scene.isActive(assetConf.scene.game)) {
        this.scene.resume(assetConf.scene.game);
        this.sound.resumeAll();
      }
    });

    // Confirm button
    const btnConfirm = this.add
      .image(0, 0, assetConf.image.btnConfirm)
      .setOrigin(0.5)
      .setDepth(102)
      .setInteractive({useHandCursor: true});

    btnConfirm.on("pointerdown", () => {
      const game = this.scene.get(assetConf.scene.game) as Game;

      if (game.theme) game.theme.stop();
      EventBus.emit(PhaserEvents.EXIT_GAME);
    });

    //* Bottoni centrati e impilati: conferma sopra, annulla sotto
    const buttonOffsetY = (btnConfirm.height + BUTTON_GAP) / 2;

    btnConfirm.setPosition(0, BUTTONS_CENTER_Y - buttonOffsetY);
    btnCancel.setPosition(0, BUTTONS_CENTER_Y + buttonOffsetY);

    const confirmLabel = this.#addLabel(btnConfirm.x, btnConfirm.y, t("confirm", language), {
      fontSize: 40,
      color: "#fff8dc",
    });
    const cancelLabel = this.#addLabel(btnCancel.x, btnCancel.y, t("cancel", language), {
      fontSize: 40,
      color: "#fff8dc",
    });

    this.popupContainer.add([
      popupExitGame,
      title,
      btnCancel,
      btnConfirm,
      confirmLabel,
      cancelLabel,
    ]);
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

  public createExitButton(scene: Phaser.Scene, theme?: Phaser.Sound.BaseSound) {
    const config = scene.sys.game.config as {width: number; height: number};
    const width = config.width;

    const isTesting: boolean = scene.registry.get("test"); // prende variabile dall'esterno

    const inset = this.gameScene.setDynamicValueBasedOnScale(HEADER_INSET_MIN, HEADER_INSET_MAX);
    const headerY = this.gameScene.uiManager?.headerCenterY ?? inset;

    const exitButton = scene.add
      .image(width - inset, headerY, assetConf.image.btnExitGame)
      .setOrigin(0.5)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(100)
      .setScale(this.gameScene.setDynamicValueBasedOnScale(0.35, 1.0));

    exitButton.on("pointerdown", () => {
      if (isTesting) {
        if (theme) theme.stop();
        EventBus.emit(PhaserEvents.EXIT_GAME);
      } else {
        scene.scene.launch(assetConf.scene.exitManager);
        const exitManager = scene.scene.get(assetConf.scene.exitManager) as ExitManager;
      }
    });

    return exitButton;
  }
}
