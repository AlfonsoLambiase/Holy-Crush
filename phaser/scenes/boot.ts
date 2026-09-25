import * as Phaser from "phaser";

import {getStageIndex} from "@/settings/progress";
import {loadAudios, loadFonts, loadImages, loadSpritesheets} from "../shared/utils/load-assets";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {DEFAULT_STAGE} from "../shared/config/asset-paths.const";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

export class Boot extends Phaser.Scene {
  sponsorLogo?: string;
  isTesting: boolean = false;
  safeTop: number = 0; //! notch Area
  stage: number = DEFAULT_STAGE;

  isInit: boolean = false;

  constructor() {
    super({key: assetConf.scene.boot});
  }

  init(data: {
    sponsorLogo: string;
    isTesting: boolean;
    safeTop?: number; //! notch Area
    stage?: number;
  }) {
    if (!this.isInit) {
      this.sponsorLogo = data.sponsorLogo;
      this.isTesting = data.isTesting;
      this.safeTop = data.safeTop || 0; //! notch Area
      this.stage = getStageIndex() + 1;

      this.registry.set("safeTop", this.safeTop); //! notch Area

      this.isInit = true;
    }
  }

  preload() {
    console.log("Safe area top:", this.safeTop); //! notch Area

    this.load.on("complete", () => this.startGame());

    this.#loadAssets();

    // Initialize game data
    this.registry.set(assetConf.registry.score, 0);
    this.registry.set(assetConf.registry.coins, 0);
    this.registry.set("stage", this.stage);
    this.registry.set("sponsorLogo", this.sponsorLogo);
    this.registry.set("test", this.isTesting);

    if (this.sponsorLogo !== "empty") {
      this.load.image("logo_stage", this.sponsorLogo);
    }
  }

  startGame() {
    this.scene.start(assetConf.scene.opening);
  }

  #loadAssets(): void {
    loadAudios(this);
    loadSpritesheets(this, this.stage);
    loadImages(this, this.stage);
    loadFonts(this);
  }
}
