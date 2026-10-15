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
import {EXTRA_MOVES} from "../shared/level-mission";

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
  #moveOffer = false;

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
    this.gameManager.presentMission();
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

  gameOver(won = false): void {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.#moveOffer = false;
    this.gameManager.isGameOver = true;
    this.gameManager.canShoot = false;

    const delay = won ? 1200 : 1000;

    this.audioManager.playAudio(won ? assetConf.audio.endWin : assetConf.audio.endFailed);
    this.time.delayedCall(delay, () => {
      this.#openOutro(won ? "Win" : "Failed");
    });
  }

  //* La griglia resta viva sotto la sconfitta. Un solo annuncio, poi si riprende.
  offerMoveAd(): void {
    if (this.isGameOver || this.#moveOffer) return;

    this.#moveOffer = true;
    this.sound.pauseAll();
    this.scene.launch(assetConf.scene.outro, {resultStatus: "Failed", canContinue: true});
    this.scene.bringToTop(assetConf.scene.outro);
    this.scene.bringToTop(assetConf.scene.exitManager);
    this.scene.pause();
    this.scene.pause(assetConf.scene.gameManager);
  }

  continueAfterAd(): void {
    this.#moveOffer = false;
    this.scene.resume();
    this.scene.resume(assetConf.scene.gameManager);
    this.sound.resumeAll();
    this.gameManager.grantExtraMoves(EXTRA_MOVES);
  }

  #openOutro(resultStatus: "Failed" | "Win"): void {
    if (this.theme) this.theme.stop();
    this.scene.stop(assetConf.scene.gameManager);
    this.scene.stop(assetConf.scene.timerManager);
    this.scene.start(assetConf.scene.outro, {resultStatus});
  }
}
