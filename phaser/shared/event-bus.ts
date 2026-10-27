import * as Phaser from "phaser";

export const PhaserEvents = {
  END_GAME: "endGame",
  END_WIN: "endWin",
  EXIT_GAME: "exitGame",
  OPENING_READY: "openingReady",
} as const;

export type PhaserEvent = (typeof PhaserEvents)[keyof typeof PhaserEvents];

//* Ponte fra le scene Phaser e React
export const EventBus = new Phaser.Events.EventEmitter();
