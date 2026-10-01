/* eslint-disable @typescript-eslint/no-unused-vars */
import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {playClick} from "@/settings/click";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../shared/config/layout.const";
import {EventBus, PhaserEvents} from "../shared/event-bus";

import {Game} from "./game";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

const BUTTON_GAP = 40; // spazio verticale fra conferma e annulla
const BUTTONS_CENTER_Y = 70; // centro della coppia bottoni (positivo = più in basso)
const TITLE_Y_RATIO = -0.22; // titolo nella parte alta del pannello
const PRESS_MS = 220; // stessa attesa del premuto sugli altri bottoni
const PRESS_SCALE = 0.92;

type PopupMode = "exit" | "reload";

export class ExitManager extends Phaser.Scene {
  private width!: number;
  private height!: number;

  private backgroundOverlay!: Phaser.GameObjects.Graphics;
  private outsideDismiss!: Phaser.GameObjects.Rectangle;
  private popupContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;

  gameScene!: Game;
  private choiceLocked = false;
  #dismissReady = false;
  #mode: PopupMode = "exit";

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

    this.titleText = this.#addLabel(0, popupExitGame.height * TITLE_Y_RATIO, t("exitTitle", language), {
      fontSize: 46,
      color: "#ffd76a",
      wordWrapWidth: popupExitGame.width * 0.72,
    });

    const btnCancel = this.add
      .image(0, 0, assetConf.image.btnCancel)
      .setOrigin(0.5)
      .setInteractive({useHandCursor: true});
    const btnConfirm = this.add
      .image(0, 0, assetConf.image.btnConfirm)
      .setOrigin(0.5)
      .setInteractive({useHandCursor: true});

    //* Bottoni centrati e impilati: conferma sopra, annulla sotto. Testo nello stesso contenitore, così il premuto scala tutto insieme
    const buttonOffsetY = (btnConfirm.height + BUTTON_GAP) / 2;
    const confirmPlate = this.#choicePlate(
      0,
      BUTTONS_CENTER_Y - buttonOffsetY,
      btnConfirm,
      t("confirm", language),
      () => this.#confirmChoice(),
    );
    const cancelPlate = this.#choicePlate(
      0,
      BUTTONS_CENTER_Y + buttonOffsetY,
      btnCancel,
      t("cancel", language),
      () => this.#resumeGame(),
    );

    this.popupContainer.add([popupExitGame, this.titleText, confirmPlate, cancelPlate]);
  }

  #choicePlate(
    x: number,
    y: number,
    button: Phaser.GameObjects.Image,
    label: string,
    onPress: () => void,
  ) {
    const plate = this.add.container(x, y, [
      button,
      this.#addLabel(0, 0, label, {fontSize: 40, color: "#fff8dc"}),
    ]);

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

  #resumeGame() {
    this.choiceLocked = false;
    this.#dismissReady = false;
    this.backgroundOverlay.setVisible(false);
    this.popupContainer.setVisible(false);
    this.outsideDismiss.disableInteractive();

    if (this.scene.isPaused(assetConf.scene.game)) {
      this.scene.resume(assetConf.scene.game);
    }

    this.sound.resumeAll();
  }

  #confirmChoice() {
    if (this.#mode === "reload") {
      this.#restartMatch();

      return;
    }

    this.#backToStage();
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
    this.titleText?.setText(
      t(this.#mode === "reload" ? "reloadTitle" : "exitTitle", getCurrentLanguage()),
    );
    this.choiceLocked = false;
    this.#dismissReady = false;
    this.backgroundOverlay?.setVisible(true);
    this.popupContainer?.setVisible(true);
    this.outsideDismiss.setInteractive({useHandCursor: false});
    this.popupContainer?.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Container) child.setScale(1);
    });
    this.time.delayedCall(120, () => {
      this.#dismissReady = true;
    });
  }

  #openPopup(scene: Phaser.Scene, mode: PopupMode) {
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

  public createExitButton(scene: Phaser.Scene, theme?: Phaser.Sound.BaseSound) {
    const config = scene.sys.game.config as {width: number; height: number};
    const width = config.width;

    const isTesting: boolean = scene.registry.get("test"); // prende variabile dall'esterno

    const inset = this.gameScene.setDynamicValueBasedOnScale(HEADER_INSET_MIN, HEADER_INSET_MAX);
    const headerY = this.gameScene.uiManager?.headerCenterY ?? inset;
    const buttonScale = this.gameScene.setDynamicValueBasedOnScale(0.35, 1.0);

    const exitButton = scene.add
      .image(width - inset, headerY, assetConf.image.btnExitGame)
      .setOrigin(0.5)
      .setInteractive({useHandCursor: true})
      .setScrollFactor(0)
      .setDepth(100)
      .setScale(buttonScale);

    exitButton.on("pointerdown", () => {
      playClick();
      if (isTesting) {
        if (theme) theme.stop();
        EventBus.emit(PhaserEvents.EXIT_GAME);
      } else {
        this.#openPopup(scene, "exit");
      }
    });

    return exitButton;
  }

  public createReloadButton(scene: Phaser.Scene) {
    const config = scene.sys.game.config as {width: number; height: number};
    const width = config.width;
    const isTesting: boolean = scene.registry.get("test");
    const inset = this.gameScene.setDynamicValueBasedOnScale(HEADER_INSET_MIN, HEADER_INSET_MAX);
    const headerY = this.gameScene.uiManager?.headerCenterY ?? inset;
    const buttonScale = this.gameScene.setDynamicValueBasedOnScale(0.35, 1.0);
    const exitX = width - inset;
    const reloadX = (width / 2 + exitX) / 2;

    if (!scene.textures.exists(assetConf.image.btnReload)) return null;

    const reloadButton = scene.add
      .image(reloadX, headerY, assetConf.image.btnReload)
      .setOrigin(0.5)
      .setInteractive({useHandCursor: true})
      .setScrollFactor(0)
      .setDepth(100)
      .setScale(buttonScale);

    reloadButton.on("pointerdown", () => {
      playClick();

      if (isTesting) return;

      this.#openPopup(scene, "reload");
    });

    return reloadButton;
  }
}
