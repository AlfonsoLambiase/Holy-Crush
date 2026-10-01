import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {playClick} from "@/settings/click";
import {CandyCrushAssetConf} from "./config/asset-conf.const";
import {APP_FONT} from "./config/font.const";

const assetConf = CandyCrushAssetConf;

const WATCH_BTN_W = 520;
const WATCH_BTN_H = 96;
const TITLE_Y_RATIO = -0.1;
const BODY_Y_RATIO = 0.06;
const WATCH_Y_RATIO = 0.19;

export type WatchAdPopup = {
  close: () => void;
};

type WatchAdPopupOptions = {
  title: string;
  body: string;
  scale: number;
  onWatch: () => void;
  onClose?: () => void;
};

export const showWatchAdPopup = (
  scene: Phaser.Scene,
  options: WatchAdPopupOptions,
): WatchAdPopup | null => {
  if (!scene.textures.exists(assetConf.image.popupExitGame)) return null;

  const {width, height} = scene.scale;
  const scale = options.scale;
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
  const wrap = plate.width * 0.62;
  const popup = scene.add.container(width / 2, height / 2).setDepth(42).setScrollFactor(0);
  const title = scene.add
    .text(0, plate.height * TITLE_Y_RATIO, options.title, {
      fontFamily: APP_FONT,
      fontSize: "42px",
      color: "#ffd76a",
      align: "center",
      wordWrap: {width: wrap},
      stroke: "#2a160c",
      strokeThickness: 6,
    })
    .setOrigin(0.5);
  const body = scene.add
    .text(0, plate.height * BODY_Y_RATIO, options.body, {
      fontFamily: APP_FONT,
      fontSize: "32px",
      color: "#fff8dc",
      align: "center",
      wordWrap: {width: wrap},
      stroke: "#2a160c",
      strokeThickness: 4,
    })
    .setOrigin(0.5);
  const watchLocalY = plate.height * WATCH_Y_RATIO;
  const watchVisual = addWatchVisual(scene, 0, watchLocalY);

  let consumed = false;

  popup.add([plate, title, body, watchVisual]);
  popup.setScale(scale);

  //* Hit separato dal container scalato: in Phaser il touch sui figli annidati spesso non arriva
  const watchHit = scene.add
    .rectangle(width / 2, height / 2 + watchLocalY * scale, WATCH_BTN_W * scale, WATCH_BTN_H * scale, 0xffffff, 0.001)
    .setScrollFactor(0)
    .setDepth(43)
    .setInteractive({useHandCursor: true});

  const dismissTargets: Phaser.GameObjects.GameObject[] = [popup, overlay, blocker, watchHit];

  const close = () => {
    blocker.off("pointerup", onOutsideUp);
    watchHit.off("pointerdown", onWatchPress);
    for (const target of dismissTargets) target.destroy(true);
    options.onClose?.();
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

  return {close};
};

const addWatchVisual = (scene: Phaser.Scene, x: number, y: number) => {
  const radius = 28;
  const face = scene.add.graphics();

  face.fillStyle(0x3d2614, 1);
  face.fillRoundedRect(-WATCH_BTN_W / 2, -WATCH_BTN_H / 2, WATCH_BTN_W, WATCH_BTN_H, radius);
  face.lineStyle(4, 0xa67c22, 1);
  face.strokeRoundedRect(-WATCH_BTN_W / 2, -WATCH_BTN_H / 2, WATCH_BTN_W, WATCH_BTN_H, radius);
  face.lineStyle(4, 0x2a160c, 0.8);
  face.strokeRoundedRect(
    -WATCH_BTN_W / 2 - 6,
    -WATCH_BTN_H / 2 - 6,
    WATCH_BTN_W + 12,
    WATCH_BTN_H + 12,
    radius + 6,
  );

  const text = scene.add
    .text(0, 0, t("watchAd", getCurrentLanguage()), {
      fontFamily: APP_FONT,
      fontSize: "28px",
      color: "#fff8dc",
      align: "center",
      stroke: "#2a160c",
      strokeThickness: 4,
    })
    .setOrigin(0.5);

  return scene.add.container(x, y, [face, text]);
};
