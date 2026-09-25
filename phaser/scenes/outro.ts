/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import * as Phaser from "phaser";

import {getStageIndex, registerWin} from "@/settings/progress";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {AssetPaths} from "../shared/config/asset-paths.const";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

export class Outro extends Phaser.Scene {
  imageKey: string = "endFailed"; // di default è endFailed

  constructor() {
    super({key: assetConf.scene.outro});
  }

  init({resultStatus}: {resultStatus: "Failed" | "Win"}) {
    const won = resultStatus === "Win";

    this.imageKey = won ? "endWin" : "endFailed";

    const stageCleared = won && registerWin();

    this.time.delayedCall(3000, () => this.#leave(stageCleared));
  }

  #leave(stageCleared: boolean) {
    if (!stageCleared) {
      this.scene.start(assetConf.scene.stageMap);

      return;
    }

    const stage = getStageIndex() + 1;

    this.registry.set("stage", stage);

    for (const key of [
      assetConf.image.opening,
      assetConf.image.backgroundStage,
      assetConf.image.road,
      assetConf.image.backgroundGame,
      assetConf.image.endBackground,
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
    const background = this.add
      .image(width / 2, height / 2, assetConf.image.endBackground)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(width, height);

    // Immagine principale con origine in basso al centro
    const foreground = this.add.image(width / 2, height, this.imageKey).setOrigin(0.5, 1); // Origine in basso al centro

    // Calcola scala proporzionale in base alla larghezza dello schermo
    const scale = width / foreground.width;

    foreground.setScale(scale);

    //console.log("registry.score: ", this.registry.get(assetConf.registry.score));
  }
}
