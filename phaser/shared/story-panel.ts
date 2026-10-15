import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {cappedDevicePixelRatio} from "@/settings/app-header-layout";
import {APP_FONT} from "./config/font.const";

const TYPE_SPEED_MS = 55;
const GOLD = 0xffd76a;
/** Layout contain + bleed: soglie in px CSS (Phaser scale = fisici × DPR). */
const TABLET_MIN_CSS_SHORT = 640;
const TABLET_MIN_CSS_LONG = 900;
//* Spazio sopra il testo e sotto per "tocca per continuare", in multipli del font.
const STORY_PANEL_TEXT_PAD = 2.4;

export const STORY_PANEL_HEIGHT_RATIO = 0.3;
export const STORY_PANEL_BOTTOM_MARGIN_RATIO = 0.035;
export const STORY_PANEL_WIDTH_RATIO = 0.86;
/** Su telefono il pannello è alto al massimo questa quota dell'immagine sopra cui sta. */
export const STORY_PANEL_ART_RATIO = 0.36;

export type StoryPanel = {
  isComplete: () => boolean;
  complete: () => void;
  destroy: () => void;
  objects: Phaser.GameObjects.GameObject[];
  centerY: number;
  height: number;
};

type StoryPanelOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  depth: number;
};

export const isTallStoryLayout = (width: number, height: number): boolean => {
  const dpr = cappedDevicePixelRatio();
  const cssShort = Math.min(width, height) / dpr;
  const cssLong = Math.max(width, height) / dpr;

  return cssShort >= TABLET_MIN_CSS_SHORT && cssLong >= TABLET_MIN_CSS_LONG;
};

export const storyFontSize = (width: number, height: number): number => {
  const aspect = width / Math.max(height, 1);

  return Math.round(
    isTallStoryLayout(width, height)
      ? Phaser.Math.Clamp(Math.min(width * 0.042, height * 0.034), 22, aspect > 0.72 ? 48 : 58)
      : Phaser.Math.Clamp(width * 0.042, 26, 58),
  );
};

//* Pannello delle opening: testo che si compone lettera per lettera, poi "tocca per continuare".
export const addStoryPanel = (scene: Phaser.Scene, options: StoryPanelOptions): StoryPanel => {
  const {x, width, text, depth} = options;
  const fontSize = storyFontSize(scene.scale.width, scene.scale.height);
  const language = getCurrentLanguage();
  let complete = false;

  const body = scene.add
    .text(x, 0, text, {
      align: "center",
      color: "#fff8dc",
      fontFamily: APP_FONT,
      fontSize: `${fontSize}px`,
      lineSpacing: Math.round(fontSize * 0.28),
      wordWrap: {width: width * 0.9, useAdvancedWrap: true},
      stroke: "#1a1208",
      strokeThickness: 5,
    })
    .setOrigin(0.5)
    .setDepth(depth + 1);

  const fullText = body.getWrappedText().join("\n");

  body.setText(fullText);
  body.setFixedSize(body.width, body.height);
  body.setText("");

  //* Se il testo non ci sta il pannello cresce verso l'alto: il fondo resta dov'era.
  const height = Math.max(options.height, body.height + fontSize * STORY_PANEL_TEXT_PAD);
  const y = options.y + options.height / 2 - height / 2;

  body.setY(y - fontSize * 0.35);

  const panel = scene.add
    .rectangle(x, y, width, height, 0x140d2d, 0.72)
    .setStrokeStyle(3, GOLD, 0.85)
    .setDepth(depth);

  const footer = scene.add
    .text(x, y + height / 2 - fontSize * 0.7, t("tapToContinue", language), {
      color: "#ffd76a",
      fontFamily: APP_FONT,
      fontSize: `${Math.round(fontSize * 0.48)}px`,
    })
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(depth + 1);

  const finish = () => {
    if (complete) return;

    complete = true;
    typeEvent.remove();
    body.setText(fullText);
    scene.tweens.add({targets: footer, alpha: 1, duration: 400, ease: "Sine.easeOut"});
  };

  let visible = 0;

  const typeEvent = scene.time.addEvent({
    delay: TYPE_SPEED_MS,
    repeat: Math.max(0, fullText.length - 1),
    callback: () => {
      visible++;
      body.setText(fullText.slice(0, visible));

      if (visible >= fullText.length) finish();
    },
  });

  const objects = [panel, body, footer];

  return {
    isComplete: () => complete,
    complete: finish,
    destroy: () => {
      typeEvent.remove();
      objects.forEach((object) => object.destroy());
    },
    objects,
    centerY: y,
    height,
  };
};
