import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {layoutScaleForViewport} from "@/settings/app-header-layout";
import {playClick} from "@/settings/click";
import {CandyCrushAssetConf} from "./config/asset-conf.const";
import {APP_FONT} from "./config/font.const";
import {animatePopupClose, animatePopupOpen} from "./popup-motion";

const assetConf = CandyCrushAssetConf;

//* Stessi estremi del titolo exit/reload.
const TITLE_FONT_MIN = 64;
const TITLE_FONT_MAX = 82;
const BODY_FONT_MIN = 56;
const BODY_FONT_MAX = 72;
const BUTTON_FONT_MIN = 52;
const BUTTON_FONT_MAX = 68;
const TITLE_Y_RATIO = -0.22;
const TITLE_BODY_GAP_RATIO = 0.04;
const BODY_BUTTON_GAP_RATIO = 0.05;
//* Solo il bottone, un filo più in basso della piastra.
const BUTTON_DROP_RATIO = 0.035;
const INNER_EDGE_RATIO = 0.4;
const BUTTON_WIDTH_RATIO = 0.74;

export type WatchAdPopup = {
  close: () => void;
};

type WatchAdPopupOptions = {
  title: string;
  body: string;
  scale: number;
  /** 1 = booster. Sotto 1 rimpicciolisce testi e bottone insieme. */
  textScale?: number;
  onWatch: () => void;
  onClose?: () => void;
};

const fontPx = (scene: Phaser.Scene, min: number, max: number): number => {
  const {width, height} = scene.scale;

  return layoutScaleForViewport(width, height, min, max);
};

export const showWatchAdPopup = (
  scene: Phaser.Scene,
  options: WatchAdPopupOptions,
): WatchAdPopup | null => {
  if (!scene.textures.exists(assetConf.image.popupExitGame)) return null;

  const {width, height} = scene.scale;
  const scale = options.scale;
  const textScale = options.textScale ?? 1;
  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
    .setDepth(40)
    .setScrollFactor(0);
  const blocker = scene.add
    .rectangle(width / 2, height / 2, width, height, 0xffffff, 0.001)
    .setScrollFactor(0)
    .setDepth(41)
    .setInteractive({useHandCursor: false});
  const plate = scene.add.image(0, 0, assetConf.image.popupExitGame).setOrigin(0.5);
  const wrap = plate.width * 0.78;
  const popup = scene.add.container(width / 2, height / 2).setDepth(42).setScrollFactor(0);
  const title = scene.add
    .text(0, plate.height * TITLE_Y_RATIO, options.title, {
      fontFamily: APP_FONT,
      fontSize: `${fontPx(scene, TITLE_FONT_MIN, TITLE_FONT_MAX) * textScale}px`,
      color: "#ffd76a",
      align: "center",
      wordWrap: {width: wrap},
      stroke: "#3d2614",
      strokeThickness: 5,
    })
    .setOrigin(0.5);
  const body = scene.add
    .text(0, 0, options.body, {
      fontFamily: APP_FONT,
      fontSize: `${fontPx(scene, BODY_FONT_MIN, BODY_FONT_MAX) * textScale}px`,
      color: "#fff8dc",
      align: "center",
      wordWrap: {width: wrap},
      stroke: "#3d2614",
      strokeThickness: 5,
    })
    .setOrigin(0.5);
  const watch = addWatchVisual(
    scene,
    fontPx(scene, BUTTON_FONT_MIN, BUTTON_FONT_MAX) * textScale,
    plate.width * BUTTON_WIDTH_RATIO * textScale,
  );

  body.setY(title.y + title.height / 2 + plate.height * TITLE_BODY_GAP_RATIO + body.height / 2);

  let watchY = body.y + body.height / 2 + plate.height * BODY_BUTTON_GAP_RATIO + watch.height / 2;
  const overflow = watchY + watch.height / 2 - plate.height * INNER_EDGE_RATIO;

  if (overflow > 0) {
    title.y -= overflow;
    body.y -= overflow;
    watchY -= overflow;
  }

  watchY += plate.height * BUTTON_DROP_RATIO;
  watch.root.setY(watchY);

  let consumed = false;
  let closing = false;

  popup.add([plate, title, body, watch.root]);
  popup.setScale(scale);

  //* Hit separato dal container scalato: in Phaser il touch sui figli annidati spesso non arriva
  const watchHit = scene.add
    .rectangle(
      width / 2,
      height / 2 + watchY * scale,
      watch.width * scale,
      watch.height * scale,
      0xffffff,
      0.001,
    )
    .setScrollFactor(0)
    .setDepth(43)
    .setInteractive({useHandCursor: true});

  const dismissTargets: Phaser.GameObjects.GameObject[] = [popup, overlay, blocker, watchHit];

  const destroyAll = () => {
    blocker.off("pointerup", onOutsideUp);
    watchHit.off("pointerdown", onWatchPress);
    for (const target of dismissTargets) target.destroy(true);
    options.onClose?.();
  };

  const close = () => {
    if (closing) return;

    closing = true;
    watchHit.disableInteractive();
    animatePopupClose(scene, popup, scale, [overlay, blocker, watchHit], destroyAll);
  };

  const runWatch = () => {
    if (consumed) return;

    consumed = true;

    try {
      options.onWatch();
    } catch {
      consumed = false;

      return;
    }

    close();
  };

  const onWatchPress = (
    _pointer: Phaser.Input.Pointer,
    _x: number,
    _y: number,
    event: Phaser.Types.Input.EventData,
  ) => {
    event.stopPropagation();
    playClick();
    runWatch();
  };

  watchHit.on("pointerdown", onWatchPress);

  const onOutsideUp = () => {
    if (!popup.active || consumed) return;

    close();
  };

  blocker.on("pointerup", onOutsideUp);
  animatePopupOpen(scene, popup, scale, [overlay, blocker]);

  return {close};
};

const addWatchVisual = (
  scene: Phaser.Scene,
  fontSize: number,
  maxWidth: number,
): {root: Phaser.GameObjects.Container; width: number; height: number} => {
  const label = scene.add
    .text(0, 0, t("watchAd", getCurrentLanguage()), {
      fontFamily: APP_FONT,
      fontSize: `${fontSize}px`,
      color: "#fff8dc",
      align: "center",
      stroke: "#2a160c",
      strokeThickness: 6,
    })
    .setOrigin(0.5);

  const padX = fontSize * 0.8;
  let size = fontSize;

  while (label.width + padX * 2 > maxWidth && size > 40) {
    size -= 2;
    label.setFontSize(`${size}px`);
  }

  const width = maxWidth;
  const height = Math.max(label.height + size * 0.95, size * 2.4);
  const radius = Math.round(height * 0.28);
  const face = scene.add.graphics();

  face.fillStyle(0x3d2614, 1);
  face.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  face.lineStyle(5, 0xa67c22, 1);
  face.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  face.lineStyle(5, 0x2a160c, 0.8);
  face.strokeRoundedRect(
    -width / 2 - 7,
    -height / 2 - 7,
    width + 14,
    height + 14,
    radius + 7,
  );

  return {
    root: scene.add.container(0, 0, [face, label]),
    width,
    height,
  };
};
