import * as Phaser from "phaser";

export const PhaserEvents = {
  END_GAME: "endGame",
  EXIT_GAME: "exitGame",
} as const;

export type PhaserEvent = (typeof PhaserEvents)[keyof typeof PhaserEvents];

//* Ponte fra le scene Phaser e React
export const EventBus = new Phaser.Events.EventEmitter();
