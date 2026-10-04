/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */

import * as Phaser from "phaser";

import {UIManager} from "../components/UIManager";
import {AudioManager} from "../components/audioManager";
import {playTrack} from "@/settings/soundtrack";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {layoutScaleForViewport} from "@/settings/app-header-layout";
import {getViewportGlobalScale} from "../shared/viewport-scale";
import {StarsEffectManager} from "../components/starsEffectManager";

import {TimerManager} from "./timer-manager";
import {ExitManager} from "./exit-manager";
import {GameManager} from "./game-manager";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

export class Game extends Phaser.Scene {
  gameManager!: GameManager;
  audioManager!: AudioManager;
  timerManager!: TimerManager;
  uiManager!: UIManager;

  theme!: Phaser.Sound.BaseSound;

  valueScale!: number;

  private globalScale: number = 1;

  private isGameOver: boolean = false; // controllo aggiuntivo per eveitare che possa andare 2 volte in gameOver

  starsEffectManager!: StarsEffectManager;

  constructor() {
    super({key: assetConf.scene.game});
  }

  init() {
    console.log("Start Scene Game");
    this.isGameOver = false;
  }

  create() {
    this.setGlobalScale();

    // Inizializza il GameManager
    this.initializeGameManager();

    this.starsEffectManager = new StarsEffectManager(this);

    this.uiManager = new UIManager(this);
    this.uiManager.setGameScene(this);
    this.uiManager.createUI();
    this.gameManager.layoutGrid();

    this.audioManager = new AudioManager(this);
    this.audioManager.loadAudios();
    playTrack("game");

    const exitManager = this.scene.get(assetConf.scene.exitManager) as ExitManager;

    exitManager.setGameScene(this);
    this.scene.bringToTop(assetConf.scene.exitManager);

    // this.scene.launch(assetConf.scene.timerManager); //* è una estensione della classe Phaser.Scene. Si inizializza in questo modo.
    // this.timerManager = this.scene.get(assetConf.scene.timerManager) as TimerManager;
    // this.timerManager.setGameScene(this);
    // this.timerManager.startTimer();

    // this.addLogoPhaser();
  }

  private initializeGameManager() {
    // Aggiungi la scena GameManager al scene manager se non è già presente
    if (!this.scene.manager.getScene(assetConf.scene.gameManager)) {
      this.scene.manager.add(assetConf.scene.gameManager, GameManager, false);
    }

    // Avvia la scena GameManager
    this.scene.launch(assetConf.scene.gameManager, {
      gameScene: this,
    });

    // Ottieni riferimento al manager
    this.gameManager = this.scene.get(assetConf.scene.gameManager) as GameManager;
  }

  // //! Solo per test
  addLogoPhaser() {
    // logoPhaser
    const logoPhaser = this.add.image(this.scale.width - 50, this.scale.height - 50, "logoPhaser"); // metodo per riprendere le variabili dalla page.tsx del game.

    logoPhaser.setOrigin(0.5).setDepth(-1).setScale(this.setDynamicValueBasedOnScale(0.7, 1.0));
  }

  getGlobalScale(): number {
    return this.globalScale;
  }

  // Metodo per ridimensionare gli oggetti in scena dipendendo dal tipo di dispositivo e della sua dimensione schermo.
  //! Metodo nuovo piu robusto copiare questo in tutti gli altri
  setGlobalScale() {
    this.globalScale = getViewportGlobalScale(this);
  }

  setDynamicValueBasedOnScale(minValue: number, maxValue: number): number {
    return layoutScaleForViewport(this.scale.width, this.scale.height, minValue, maxValue);
  }

  //* Scopo: Scala uniforme per far stare un oggetto dentro un rettangolo
  fitUniformScale(nativeW: number, nativeH: number, maxW: number, maxH: number): number {
    if (nativeW <= 0 || nativeH <= 0 || maxW <= 0 || maxH <= 0) return 1;

    return Math.min(maxW / nativeW, maxH / nativeH);
  }

  startAnimConfetti() {
    const config = this.sys.game.config as {width: number; height: number};

    // Create spriteLeft
    const spriteLeft = this.add
      .sprite(0, config.height / 2, assetConf.spritesheet.confetti_left.key)
      .setOrigin(0, 0.5)
      .setDepth(15)
      .setScale(5)
      .setScrollFactor(0);

    if (!this.anims.exists("animConfettiLeft")) {
      this.anims.create({
        key: "animConfettiLeft",
        frames: this.anims.generateFrameNumbers(assetConf.spritesheet.confetti_left.key, {
          start: 0,
          end: 54,
        }),
        frameRate: 20,
      });
    }

    spriteLeft.play("animConfettiLeft");

    // Create spriteRight
    const spriteRight = this.add
      .sprite(config.width, config.height / 2, assetConf.spritesheet.confetti_right.key)
      .setOrigin(1, 0.5)
      .setDepth(15)
      .setScale(5)
      .setScrollFactor(0);

    if (!this.anims.exists("animConfettiRight")) {
      this.anims.create({
        key: "animConfettiRight",
        frames: this.anims.generateFrameNumbers(assetConf.spritesheet.confetti_right.key, {
          start: 0,
          end: 54,
        }),
        frameRate: 20,
      });
    }

    spriteRight.play("animConfettiRight");
  }

  gameOver(): void {
    if (!this.isGameOver) {
      this.isGameOver = true;
      this.gameManager.isGameOver = true;
      this.gameManager.canShoot = false;

      let delay = 1000;

      if (this.uiManager.score >= this.uiManager.maxScore) {
        console.log("HAI VINTO LA PARTITA COMPLIMENTI!!!");
        this.startAnimConfetti();
        delay = 3000;
        this.audioManager.playAudio(assetConf.audio.endWin);
      } else {
        console.log("HAI PERSO LA PARTITA!!!");
        delay = 1000;
        this.audioManager.playAudio(assetConf.audio.endFailed);
      }

      this.time.delayedCall(delay, () => {
        if (this.theme) this.theme.stop();
        this.scene.stop(assetConf.scene.gameManager);
        this.scene.stop(assetConf.scene.timerManager);
        this.scene.start(assetConf.scene.outro, {
          resultStatus: this.uiManager.score >= this.uiManager.maxScore ? "Win" : "Failed",
        });
      });
    }
  }
}
