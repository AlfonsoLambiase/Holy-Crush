/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import * as Phaser from "phaser";

import {isEffectsEnabled} from "@/settings/effects";
import {getStageIndex, registerWin} from "@/settings/progress";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {AssetPaths} from "../shared/config/asset-paths.const";
import {addFillPair} from "../shared/fill-pair";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

const WIN_FILL_MS = 1150;
const RAINBOW_WIDTH = 0.78; // quota della larghezza schermo
const RAINBOW_Y = 0.3; // centro pagina, sopra Gesù

export class Outro extends Phaser.Scene {
  imageKey: string = "endFailed"; // di default è endFailed

  constructor() {
    super({key: assetConf.scene.outro});
  }

  init({resultStatus}: {resultStatus: "Failed" | "Win"}) {
    const won = resultStatus === "Win";

    this.imageKey = won ? "endWin" : "endFailed";

    const played = Number(this.registry.get("level"));
    const stageCleared = won && registerWin(played);

    this.time.delayedCall(3000, () => this.#leave(stageCleared));
  }

  #leave(stageCleared: boolean) {
    if (!stageCleared) {
      const played = Number(this.registry.get("level"));

      if (Number.isFinite(played) && played >= 1) {
        this.registry.set("stageMapFocusLevel", played);
      }

      this.scene.start(assetConf.scene.stageMap);

      return;
    }

    const stage = getStageIndex() + 1;

    this.registry.set("stage", stage);
    this.children.removeAll(true);

    for (const key of [
      assetConf.image.opening,
      assetConf.image.backgroundStage,
      assetConf.image.road,
      assetConf.image.backgroundGame,
      assetConf.image.endBackground,
      assetConf.image.block,
      assetConf.image.stageMascot,
    ]) {
      if (this.textures.exists(key)) this.textures.remove(key);
      this.load.image(key, AssetPaths.image(key, stage));
    }

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.scene.start(assetConf.scene.opening);
    });
    this.load.start();
  }

  create() {
    //this.imageKey = `endFailed`; //* solo per test
    //this.imageKey = `endWin`; //* solo per test

    const {width, height} = this.scale;

    // Sfondo centrato e deformato per coprire tutto
    this.add
      .image(width / 2, height / 2, assetConf.image.endBackground)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(width, height)
      .setDepth(0);

    this.#playResultSound();

    if (this.imageKey === assetConf.image.endWin) this.#addWinRainbow(width, height);

    // Immagine principale con origine in basso al centro
    const foreground = this.add.image(width / 2, height, this.imageKey).setOrigin(0.5, 1).setDepth(3);

    // Calcola scala proporzionale in base alla larghezza dello schermo
    const scale = width / foreground.width;

    foreground.setScale(scale);

    //console.log("registry.score: ", this.registry.get(assetConf.registry.score));
  }

  #playResultSound() {
    if (!isEffectsEnabled()) return;

    const key =
      this.imageKey === assetConf.image.endWin ? assetConf.audio.winSound : assetConf.audio.loseSound;

    if (this.cache.audio.exists(key)) this.sound.play(key);
  }

  #addWinRainbow(width: number, height: number) {
    const bgKey = assetConf.image.endWin_bg;
    const fillKey = assetConf.image.endWin_fill;

    if (!this.textures.exists(bgKey)) return;

    const src = this.textures.get(bgKey).getSourceImage() as {width: number};
    const pair = addFillPair(
      this,
      width / 2,
      height * RAINBOW_Y,
      bgKey,
      fillKey,
      (width * RAINBOW_WIDTH) / src.width,
      1,
      0,
      "radial",
    );

    if (!pair) return;

    const fill = {amount: 0};
    this.tweens.add({
      targets: fill,
      amount: 1,
      duration: WIN_FILL_MS,
      ease: "Sine.easeInOut",
      onUpdate: () => pair.setRemaining(fill.amount),
      onComplete: () => pair.setRemaining(1),
    });
  }
}
