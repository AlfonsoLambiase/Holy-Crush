/* eslint-disable no-console */
import * as Phaser from "phaser";

import {Game} from "../scenes/game";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {resolveHeaderMetrics} from "@/settings/app-header-layout";
import {BTN_READ_NATIVE_HEIGHT} from "@/settings/app-header-tokens";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

const MOVES_FONT_RATIO = 0.42;
const MOVES_TEXT_SCALE = 1;
const MOVES_PULSE_SCALE = 1.25;

export type GoalChip = {icon: string; left: number};

export class UIManager {
  private scene: Phaser.Scene;
  gameScene!: Game;

  originalScale: number = 1;
  ofssetY: number = 0;
  ofssetX: number = 0;
  scoreContainer!: Phaser.GameObjects.Container;
  headerCenterY = 0;
  private headerBottom = 0;
  private goalsContainer!: Phaser.GameObjects.Container;
  private movesContainer!: Phaser.GameObjects.Container;
  private movesText!: Phaser.GameObjects.Text;
  private movesFontSize = 48;

  helpUsed: number = 0;
  differenceTryLimit: number = 1; // limite massimo tasto aiuto
  public iconHelp!: Phaser.GameObjects.Image;

  //private imgLive!: Phaser.GameObjects.Image;
  private livesImages: Phaser.GameObjects.Image[] = [];
  private lives: number = 3;
  private livesImageSpacing: number = 110; // Spazio tra le icone delle vite

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createUI(): void {
    this.#createBackgroundGame();
    this.#createHeader();
    // this.#createIconHelp();
    // Vite disattivate: in questo gioco non si perdono vite
    // this.#createLives();
  }

  public setGameScene(scene: Game): void {
    this.gameScene = scene;
  }

  #createBackgroundGame() {
    const backgroundGame = this.scene.add.image(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      assetConf.image.backgroundGame,
    );

    backgroundGame
      .setDepth(-3)
      .setScrollFactor(0)
      .setDisplaySize(this.scene.scale.width, this.scene.scale.height);
  }

  #headerMetrics() {
    const safeTop = Number(this.scene.registry.get("safeTop")) || 0;

    return resolveHeaderMetrics(
      "inGame",
      this.scene.scale.width,
      this.scene.scale.height,
      safeTop,
      BTN_READ_NATIVE_HEIGHT,
    );
  }

  #createHeader() {
    const metrics = this.#headerMetrics();
    const slot = metrics.logoHeartPhysical;

    this.headerCenterY = metrics.headerCenterY;
    this.headerBottom = metrics.headerCenterY + slot / 2 + metrics.marginTop * 0.35;

    this.goalsContainer = this.scene.add.container(this.scene.scale.width / 2, this.headerCenterY);
    this.goalsContainer.setScrollFactor(0).setDepth(10);
    this.scoreContainer = this.goalsContainer;

    this.movesContainer = this.scene.add.container(0, this.headerCenterY);
    this.movesContainer.setScrollFactor(0).setDepth(10);

    const movesBg = this.scene.add.image(0, 0, assetConf.image.containerScore).setOrigin(0.5);

    movesBg.setScale(slot / movesBg.height);
    this.movesFontSize = Math.round(slot * MOVES_FONT_RATIO);
    this.movesText = this.scene.add
      .text(0, 0, "0", {
        fontFamily: APP_FONT,
        fontSize: `${this.movesFontSize}px`,
        color: "#ffd76a",
        stroke: "#2a160ccc",
        strokeThickness: Math.max(2, Math.round(this.movesFontSize * 0.08)),
      })
      .setOrigin(0.5);

    this.movesContainer.add([movesBg, this.movesText]);
    this.movesContainer.setPosition(
      this.scene.scale.width - metrics.insetX - movesBg.displayWidth / 2,
      this.headerCenterY,
    );
  }

  //* La griglia parte sotto l'elemento più basso della testata
  getHeaderBottom(): number {
    return Math.max(
      this.headerBottom,
      this.goalsContainer.getBounds().bottom,
      this.movesContainer.getBounds().bottom,
    );
  }

  showMission(goals: GoalChip[], moves: number): void {
    this.#drawGoals(goals);
    this.setMoves(moves, false);
  }

  setMoves(moves: number, pulse = true): void {
    const value = Math.max(0, moves);

    this.movesText.setText(`${value}`);
    this.movesText.setScale(MOVES_TEXT_SCALE);

    if (!pulse) return;

    this.scene.tweens.killTweensOf(this.movesText);
    this.scene.tweens.add({
      targets: this.movesText,
      scale: {from: MOVES_TEXT_SCALE, to: MOVES_TEXT_SCALE * MOVES_PULSE_SCALE},
      duration: 160,
      ease: "Quad.easeOut",
      yoyo: true,
    });
  }

  #drawGoals(goals: GoalChip[]): void {
    this.goalsContainer.removeAll(true);
    this.goalsContainer.setScale(1);

    const metrics = this.#headerMetrics();
    const slot = metrics.logoHeartPhysical;
    const iconSize = slot * 0.72;
    const gap = iconSize * 0.55;
    const fontSize = Math.round(slot * 0.36);
    let cursor = 0;
    const nodes: Phaser.GameObjects.GameObject[] = [];

    for (const goal of goals) {
      if (this.scene.textures.exists(goal.icon)) {
        const icon = this.scene.add.image(cursor, 0, goal.icon).setOrigin(0, 0.5);
        const fit = Math.min(iconSize / icon.width, iconSize / icon.height);

        icon.setScale(fit);
        nodes.push(icon);
        cursor += icon.displayWidth + gap * 0.35;
      }

      const label = this.scene.add
        .text(cursor, 0, `${goal.left}`, {
          fontFamily: APP_FONT,
          fontSize: `${fontSize}px`,
          color: "#fff8dc",
          stroke: "#3d2614",
          strokeThickness: Math.max(2, Math.round(fontSize * 0.08)),
        })
        .setOrigin(0, 0.5);

      nodes.push(label);
      cursor += label.width + gap;
    }

    const width = Math.max(0, cursor - gap);

    for (const node of nodes) {
      if ("x" in node && typeof node.x === "number") node.x -= width / 2;
    }

    this.goalsContainer.add(nodes);

    const movesWidth = this.movesContainer.getBounds().width;
    const maxWidth = this.scene.scale.width - metrics.insetX * 2 - movesWidth * 2 - gap;
    const bounds = this.goalsContainer.getBounds();

    if (bounds.width > maxWidth && bounds.width > 0) {
      this.goalsContainer.setScale(maxWidth / bounds.width);
    }
  }

  #createIconHelp() {
    //* iconHelp
    const iconHelp = this.scene.add.image(
      this.gameScene.setDynamicValueBasedOnScale(20, 50) + this.ofssetX,
      this.gameScene.setDynamicValueBasedOnScale(
        this.scene.scale.height - 75,
        this.scene.scale.height - 170,
      ) + this.ofssetY,
      "iconHelp",
    );

    iconHelp.setOrigin(0, 0.5);
    iconHelp.setDepth(0);
    iconHelp.setScale(this.gameScene.setDynamicValueBasedOnScale(0.5, 1.0));
    iconHelp.disableInteractive();
    iconHelp.setAlpha(0.4);
    iconHelp.setTint(0x999999);
    this.iconHelp = iconHelp;
    this.iconHelp.setPosition(iconHelp.x, iconHelp.y);
    this.helpUsed = this.differenceTryLimit;
  }

  // Inizializza le immagini delle vite
  #createLives(): void {
    const safeTop = this.scene.registry.get("safeTop") || 0; //! notch Area

    this.scene.anims.create({
      key: "animLiveDestroy",
      frames: this.scene.anims.generateFrameNumbers("animLive", {start: 0, end: 26}),
      frameRate: 30,
      repeat: 0,
    });

    const width = this.scene.scale.width;
    const offsetX = this.gameScene.setDynamicValueBasedOnScale(150, 350);
    const baseX = width - offsetX;

    const height = 0;
    const offsetY = this.gameScene.setDynamicValueBasedOnScale(150, 350) + 70;
    const baseY = height + offsetY + safeTop; //! notch Area

    const spacingScale = this.gameScene.setDynamicValueBasedOnScale(0.5, 1);

    // Svuota immagini precedenti
    this.livesImages.forEach((img) => img.destroy());
    this.livesImages = [];

    for (let i = 0; i < this.lives; i++) {
      const lifeSprite = this.scene.add
        .sprite(baseX + i * this.livesImageSpacing * spacingScale, baseY, "animLive", 0)
        .setScale(this.gameScene.setDynamicValueBasedOnScale(0.6, 1.2))
        .setOrigin(0.5)
        .setScrollFactor(0);

      this.livesImages.push(lifeSprite);
    }
  }

  // Aggiorna la visualizzazione delle vite
  #updateLives(decrement: number = 1): number {
    this.lives -= decrement;

    const total = this.livesImages.length;

    for (let i = 0; i < total; i++) {
      const leftIndex = total - 1 - i;

      if (i < this.lives) {
        this.livesImages[leftIndex].setVisible(true);
      } else {
        this.livesImages[leftIndex].setVisible(false);
      }
    }

    return this.lives;
  }

  updateLives(): void {
    const newLives = this.#updateLives();

    this.lives = newLives;
    if (this.lives <= 0) {
      this.gameScene.gameOver();
    }
    //this.gameScene.audioManager.playAudio(assetConf.audio.bomb);
  }
}
