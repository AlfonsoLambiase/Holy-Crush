/* eslint-disable no-console */
import * as Phaser from "phaser";

import {Game} from "../scenes/game";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {addCountBadge} from "../shared/count-badge";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

const MOVES_PULSE_SCALE = 1.25;
//* Centro dell'ultimo riquadro nel png 1080×350 (origine in alto a sinistra).
const MOVES_SLOT = {x: 913, y: 208};
const MOVES_FONT_ONE = 96;
const MOVES_FONT_TWO = 62;
//* Inizio della fascia bianca e fine d'area prima del riquadro mosse.
const GOAL_WHITE_START = 348;
const GOAL_WHITE_END = 836;
const GOAL_ICON = 100;
const GOAL_GAP = 16;
const GOAL_TICK_MS = 50;

export type GoalChip = {icon: string; left: number};

type GoalSlot = {
  icon: string;
  badge: ReturnType<typeof addCountBadge>;
  shown: number;
  target: number;
  tick?: Phaser.Time.TimerEvent;
};

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
  private scoreBar!: Phaser.GameObjects.Container;
  private movesText!: Phaser.GameObjects.Text;
  #barW = 1080;
  #goalSlots: GoalSlot[] = [];

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

  #createHeader() {
    const {width} = this.scene.scale;
    const bar = this.scene.add.image(0, 0, assetConf.image.containerScore).setOrigin(0.5, 0);
    const scale = width / bar.width;

    this.scoreBar = this.scene.add.container(width / 2, 0, [bar]);
    this.scoreBar.setScrollFactor(0).setDepth(9).setScale(scale);

    this.#barW = bar.width;
    this.headerCenterY = MOVES_SLOT.y * scale;
    this.headerBottom = bar.height * scale;

    this.goalsContainer = this.scene.add.container(0, 0);
    this.scoreBar.add(this.goalsContainer);
    this.scoreContainer = this.goalsContainer;

    this.movesText = this.scene.add
      .text(MOVES_SLOT.x - bar.width / 2, MOVES_SLOT.y, "0", {
        fontFamily: APP_FONT,
        fontSize: `${MOVES_FONT_ONE}px`,
        color: "#ffd76a",
        stroke: "#2a160ccc",
        strokeThickness: Math.max(2, Math.round(MOVES_FONT_ONE * 0.08)),
      })
      .setOrigin(0.5);

    this.scoreBar.add(this.movesText);
    this.#fitMoves(0);
  }

  //* La griglia parte sotto l'elemento più basso della testata
  getHeaderBottom(): number {
    return Math.max(this.headerBottom, this.goalsContainer.getBounds().bottom);
  }

  showMission(goals: GoalChip[], moves: number): void {
    const same =
      this.#goalSlots.length > 0 &&
      this.#goalSlots.length === goals.length &&
      this.#goalSlots.every((slot, index) => slot.icon === goals[index]?.icon);

    if (same) {
      goals.forEach((goal, index) => this.#tickGoal(this.#goalSlots[index], goal.left));
    } else {
      this.#drawGoals(goals);
    }

    this.setMoves(moves, false);
  }

  setMoves(moves: number, pulse = true): void {
    const value = Math.max(0, moves);

    this.movesText.setText(`${value}`);
    this.#fitMoves(value);

    if (!pulse) return;

    this.scene.tweens.killTweensOf(this.movesText);
    this.scene.tweens.add({
      targets: this.movesText,
      scale: {from: 1, to: MOVES_PULSE_SCALE},
      duration: 160,
      ease: "Quad.easeOut",
      yoyo: true,
    });
  }

  #fitMoves(value: number): void {
    const size = `${value}`.length <= 1 ? MOVES_FONT_ONE : MOVES_FONT_TWO;

    this.movesText.setScale(1);
    this.movesText.setFontSize(size);
    this.movesText.setStroke("#2a160ccc", Math.max(2, Math.round(size * 0.08)));
  }

  #drawGoals(goals: GoalChip[]): void {
    this.#goalSlots.forEach((slot) => slot.tick?.remove(false));
    this.#goalSlots = [];
    this.goalsContainer.removeAll(true);
    this.goalsContainer.setScale(1);
    this.goalsContainer.setPosition(GOAL_WHITE_START - this.#barW / 2, 0);

    let x = GOAL_ICON / 2;
    const y = MOVES_SLOT.y;

    for (const goal of goals) {
      if (!this.scene.textures.exists(goal.icon)) continue;

      const icon = this.scene.add.image(x, y, goal.icon).setOrigin(0.5);
      const fit = Math.min(GOAL_ICON / icon.width, GOAL_ICON / icon.height);

      icon.setScale(fit);
      this.goalsContainer.add(icon);

      const left = Math.max(0, goal.left);
      const badge = addCountBadge(
        this.scene,
        x + icon.displayWidth * 0.38,
        y + icon.displayHeight * 0.16,
        left,
        GOAL_ICON,
        12,
        this.goalsContainer,
        true,
        "goalNumber",
      );

      badge.objects.forEach((obj) => this.goalsContainer.bringToTop(obj));
      this.#goalSlots.push({icon: goal.icon, badge, shown: left, target: left});
      x += GOAL_ICON + GOAL_GAP;
    }

    const used = x - GOAL_GAP + GOAL_ICON / 2;
    const room = GOAL_WHITE_END - GOAL_WHITE_START;

    if (used > room && used > 0) this.goalsContainer.setScale(room / used);
  }

  #tickGoal(slot: GoalSlot, next: number): void {
    slot.target = Math.max(0, next);

    if (slot.shown === slot.target) return;
    if (slot.tick) return;

    slot.tick = this.scene.time.addEvent({
      delay: GOAL_TICK_MS,
      loop: true,
      callback: () => {
        if (slot.shown <= slot.target) {
          slot.shown = slot.target;
          slot.badge.setCount(slot.shown);
          slot.tick?.remove(false);
          slot.tick = undefined;

          return;
        }

        slot.shown -= 1;
        slot.badge.setCount(slot.shown);
      },
    });
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
