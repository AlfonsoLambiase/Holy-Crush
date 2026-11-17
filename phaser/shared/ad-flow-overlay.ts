import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {APP_FONT} from "./config/font.const";

const SPINNER_DEPTH = 52;
const NOTICE_DEPTH = 53;
const OVERLAY_ALPHA = 0.55;
const SPINNER_BROWN = 0x5c3a14;

export type AdFlowOverlayHandle = {
  destroy: () => void;
};

/** Overlay centrale con spinner marrone mentre si attende l’annuncio. */
export const showAdLoadingOverlay = (scene: Phaser.Scene): AdFlowOverlayHandle => {
  const {width, height} = scene.scale;
  const cx = width / 2;
  const cy = height / 2;

  const backdrop = scene.add
    .rectangle(cx, cy, width, height, 0x000000, OVERLAY_ALPHA)
    .setScrollFactor(0)
    .setDepth(SPINNER_DEPTH);

  const radius = Math.min(width, height) * 0.045;
  const track = scene.add.circle(cx, cy, radius, SPINNER_BROWN, 0.25).setScrollFactor(0).setDepth(SPINNER_DEPTH + 1);
  const arc = scene.add.graphics().setScrollFactor(0).setDepth(SPINNER_DEPTH + 2);

  const redrawArc = (angle: number) => {
    arc.clear();
    arc.lineStyle(Math.max(3, radius * 0.14), SPINNER_BROWN, 1);
    arc.beginPath();
    arc.arc(cx, cy, radius, angle, angle + Math.PI * 1.2, false);
    arc.strokePath();
  };

  let angle = 0;
  redrawArc(angle);

  const tick = scene.time.addEvent({
    delay: 32,
    loop: true,
    callback: () => {
      angle += 0.22;
      redrawArc(angle);
    },
  });

  return {
    destroy: () => {
      tick.remove();
      arc.destroy();
      track.destroy();
      backdrop.destroy();
    },
  };
};

const NOTICE_HOLD_MS = 1600;

/** Messaggio breve centrato, poi callback (es. chiudi popup e torna al gioco). */
export const showAdUnavailableNotice = (
  scene: Phaser.Scene,
  onDone: () => void,
): void => {
  const {width, height} = scene.scale;
  const cx = width / 2;
  const cy = height / 2;
  const language = getCurrentLanguage();
  const message = t("adUnavailable", language);

  const backdrop = scene.add
    .rectangle(cx, cy, width, height, 0x000000, OVERLAY_ALPHA)
    .setScrollFactor(0)
    .setDepth(NOTICE_DEPTH);

  const wrap = width * 0.78;
  const fontSize = Math.max(18, Math.round(width * 0.038));
  const label = scene.add
    .text(cx, cy, message, {
      fontFamily: APP_FONT,
      fontSize: `${fontSize}px`,
      align: "center",
      color: "#fff8dc",
      wordWrap: {width: wrap},
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(NOTICE_DEPTH + 1);

  scene.time.delayedCall(NOTICE_HOLD_MS, () => {
    backdrop.destroy();
    label.destroy();
    onDone();
  });
};