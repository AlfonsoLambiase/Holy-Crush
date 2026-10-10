import * as Phaser from "phaser";

import {cappedDevicePixelRatio} from "@/settings/app-header-layout";

//* Factory: la config dipende dalla finestra, quindi va creata al mount e non all'import
export const createCandyCrushConfig = (
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig => {
  const dpr = cappedDevicePixelRatio();

  return {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  parent,
  autoRound: false,
  scale: {
    mode: Phaser.Scale.ENVELOP, // Fit the game to the screen
    autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game on the screen
    height: window.innerHeight * dpr,
    width: window.innerWidth * dpr,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: {y: 0, x: 0},
      debug: false,
    },
  },
  transparent: true,
  input: {
    activePointers: 3, // Enable multitouch
  },
  scene: [],
  };
};
