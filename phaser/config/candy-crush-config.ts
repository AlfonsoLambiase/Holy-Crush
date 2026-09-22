import * as Phaser from "phaser";

//* Factory: la config dipende dalla finestra, quindi va creata al mount e non all'import
export const createCandyCrushConfig = (
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.CANVAS,
  width: 1920,
  height: 1080,
  parent,
  autoRound: false,
  scale: {
    mode: Phaser.Scale.ENVELOP, // Fit the game to the screen
    autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game on the screen
    height: window.innerHeight * window.devicePixelRatio,
    width: window.innerWidth * window.devicePixelRatio,
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
});
