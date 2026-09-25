import * as Phaser from "phaser";

import {createCandyCrushConfig} from "./config/candy-crush-config";
import {Boot} from "./scenes/boot";
import {ExitManager} from "./scenes/exit-manager";
import {Game} from "./scenes/game";
import {GameManager} from "./scenes/game-manager";
import {Outro} from "./scenes/outro";
import {TimerManager} from "./scenes/timer-manager";
import {OpeningScene} from "./scenes/opening";
import {StageMapScene} from "./scenes/stage-map";
import {VerseScene} from "./scenes/verse";
import {CandyCrushAssetConf} from "./shared/config/asset-conf.const";
import {AssetPaths, DEFAULT_STAGE} from "./shared/config/asset-paths.const";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

const SCENES: [string, new () => Phaser.Scene][] = [
  [assetConf.scene.boot, Boot],
  [assetConf.scene.opening, OpeningScene],
  [assetConf.scene.stageMap, StageMapScene],
  [assetConf.scene.verse, VerseScene],
  [assetConf.scene.game, Game],
  [assetConf.scene.gameManager, GameManager],
  [assetConf.scene.timerManager, TimerManager],
  [assetConf.scene.exitManager, ExitManager],
  [assetConf.scene.outro, Outro],
];

export type CreateGameOptions = {
  parent: HTMLElement;
  sponsorLogo?: string;
  isTesting?: boolean;
  safeTop?: number; //! notch Area
  stage?: number;
};

export const createGame = ({
  parent,
  sponsorLogo,
  isTesting = false,
  safeTop = 0,
  stage = DEFAULT_STAGE,
}: CreateGameOptions): Phaser.Game => {
  const game = new Phaser.Game(createCandyCrushConfig(parent));

  for (const [key, scene] of SCENES) {
    game.scene.add(key, scene);
  }

  game.scene.start(assetConf.scene.boot, {
    sponsorLogo: sponsorLogo ?? AssetPaths.image("logo_stage", stage),
    isTesting,
    safeTop,
    stage,
  });

  return game;
};
