/* eslint-disable no-console */
import * as Phaser from "phaser";

import {Game} from "../scenes/game";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {HEADER_INSET_MAX, HEADER_INSET_MIN} from "../shared/config/layout.const";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

const LOGO_BAND_MARGIN = 40; // aria sopra e sotto il logo, al posto della vecchia fascia

const SCORE_BG_WIDTH = 300; // larghezza del papiro dello score, prima della scala del container
const SCORE_TEXT_SCALE = 1;
const SCORE_PULSE_SCALE = 1.25; // ingrandimento momentaneo a ogni punto

export class UIManager {
  private scene: Phaser.Scene;
  gameScene!: Game;

  public score = 0;
  public maxScore = 10; //* temporaneo: 10 per le prove, poi torna a 100
  private displayedScore: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  originalScale: number = 1;
  ofssetY: number = 0;
  ofssetX: number = 0;
  scoreContainer!: Phaser.GameObjects.Container;
  headerCenterY = 0;
  private logoBottom = 0;

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
    this.#createLogo();
    this.#createContainerScore();
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

  #createLogo() {
    const sponsorLogo = this.scene.registry.get("sponsorLogo");
    const safeTop = this.scene.registry.get("safeTop") || 0; //! notch Area
    const inset = this.gameScene.setDynamicValueBasedOnScale(HEADER_INSET_MIN, HEADER_INSET_MAX);

    this.logoBottom = safeTop;
    this.headerCenterY = inset;

    if (sponsorLogo === "empty") return;

    const dynamicScale = this.gameScene.setDynamicValueBasedOnScale(0.4, 1.0);
    const margin = LOGO_BAND_MARGIN * dynamicScale;

    // Logo fisso in alto al centro, dove stava dentro la vecchia fascia
    const logo = this.scene.add
      .image(this.scene.scale.width / 2, safeTop + margin, "logo_stage")
      .setOrigin(0.5, 0)
      .setScale(dynamicScale)
      .setDepth(-2)
      .setScrollFactor(0);

    this.headerCenterY = logo.y + logo.displayHeight / 2;
    this.logoBottom = logo.getBounds().bottom + margin;
  }

  #createContainerScore() {
    const containerScale = this.gameScene.setDynamicValueBasedOnScale(0.3, 0.55);

    this.scoreContainer = this.scene.add.container(0, 0);
    this.scoreContainer.setScrollFactor(0).setDepth(10).setScale(containerScale);

    const scoreBg = this.scene.add.image(0, 0, assetConf.image.containerScore).setOrigin(0.5);

    scoreBg.setScale(SCORE_BG_WIDTH / scoreBg.width);

    //* Larghezza fissa: il papiro non deve respirare quando il punteggio cresce
    this.scoreText = this.scene.add
      .text(0, 0, `${this.score}`, {
        fontFamily: APP_FONT,
        fontSize: "48px",
        color: "#4b260f",
      })
      .setOrigin(0.5)
      .setScale(SCORE_TEXT_SCALE);

    this.scoreContainer.add([scoreBg, this.scoreText]);

    //* Stesso vuoto dal bordo del bottone esci, sul lato opposto
    const inset = this.gameScene.setDynamicValueBasedOnScale(HEADER_INSET_MIN, HEADER_INSET_MAX);
    const exitScale = this.gameScene.setDynamicValueBasedOnScale(0.35, 1);
    const exitImage = this.scene.textures.get(assetConf.image.btnExitGame).getSourceImage() as {
      width: number;
    };
    const exitHalf = (exitImage.width * exitScale) / 2;
    const scoreHalf = (scoreBg.displayWidth * containerScale) / 2;

    this.scoreContainer.setPosition(inset - exitHalf + scoreHalf, this.headerCenterY);
  }

  //* La griglia parte sotto l'elemento più basso della testata
  getHeaderBottom(): number {
    return Math.max(this.logoBottom, this.scoreContainer.getBounds().bottom);
  }

  #createIconHelp() {
    //* iconHelp
    const iconHelp = this.scene.add.image(
      this.gameScene.setDynamicValueBasedOnScale(20, 50) + this.ofssetX,
      this.gameScene.setDynamicValueBasedOnScale(
        this.scene.scale.height - 75,
        this.scene.scale.height - 170,
      ) + this.ofssetY,
      assetConf.image.iconHelp,
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

  //* Scopo: Aggiunge punti al punteggio totale senza superare maxScore
  updateScore(points: number) {
    const increment = 1;
    const timeDelay = 50;

    const previousScore = this.score;

    // CLAMP del punteggio finale
    const finalScore = Math.min(this.score + points, this.maxScore);

    // Punti reali da animare
    const delta = finalScore - previousScore;

    // Se non ci sono punti da aggiungere, esci
    if (delta <= 0) return;

    this.score = finalScore;

    let steps = 0;

    this.scene.time.addEvent({
      delay: timeDelay,
      repeat: delta - 1,
      callback: () => {
        this.displayedScore += increment;

        // Sicurezza extra lato UI
        if (this.displayedScore > this.maxScore) {
          this.displayedScore = this.maxScore;
        }

        this.scoreText.setText(`${this.displayedScore}`);

        this.scoreText.setScale(SCORE_TEXT_SCALE);

        this.scene.tweens.add({
          targets: this.scoreText,
          scale: {from: SCORE_TEXT_SCALE, to: SCORE_TEXT_SCALE * SCORE_PULSE_SCALE},
          duration: timeDelay * 2,
          ease: "Quad.easeOut",
          yoyo: true,
        });

        steps++;

        if (steps >= delta) {
          // Registry sempre coerente
          this.scene.registry.set(assetConf.registry.score, this.score);

          this.scoreText.setScale(SCORE_TEXT_SCALE);
        }
      },
    });
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
