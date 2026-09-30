import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {playClick} from "@/settings/click";
import {CandyCrushAssetConf} from "./config/asset-conf.const";
import {APP_FONT} from "./config/font.const";

const assetConf = CandyCrushAssetConf;

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
  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
    .setDepth(40)
    .setScrollFactor(0)
    .setInteractive();
  const plate = scene.add.image(0, 0, assetConf.image.popupExitGame).setOrigin(0.5);
  const wrap = plate.width * 0.62;
  const popup = scene.add.container(width / 2, height / 2).setDepth(41).setScrollFactor(0);
  const title = scene.add
    .text(0, plate.height * -0.16, options.title, {
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
    .text(0, plate.height * 0.02, options.body, {
      fontFamily: APP_FONT,
      fontSize: "32px",
      color: "#fff8dc",
      align: "center",
      wordWrap: {width: wrap},
      stroke: "#2a160c",
      strokeThickness: 4,
    })
    .setOrigin(0.5);

  const close = () => {
    popup.destroy(true);
    overlay.destroy();
    options.onClose?.();
  };

  popup.add([
    plate,
    title,
    body,
    addWatchButton(scene, 0, plate.height * 0.26, () => {
      close();
      options.onWatch();
    }),
  ]);
  overlay.on("pointerdown", () => close());
  popup.setScale(options.scale);

  return {close};
};

const addWatchButton = (scene: Phaser.Scene, x: number, y: number, onPress: () => void) => {
  const width = 520;
  const height = 96;
  const radius = 28;
  const face = scene.add.graphics();

  face.fillStyle(0x3d2614, 1);
  face.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  face.lineStyle(4, 0xa67c22, 1);
  face.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  face.lineStyle(4, 0x2a160c, 0.8);
  face.strokeRoundedRect(-width / 2 - 6, -height / 2 - 6, width + 12, height + 12, radius + 6);

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
  const hit = scene.add.rectangle(0, 0, width, height, 0xffffff, 0.001).setInteractive({useHandCursor: true});
  const plate = scene.add.container(x, y, [face, text, hit]);

  hit.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation();
    playClick();
    plate.setScale(0.95);
    scene.time.delayedCall(160, () => {
      plate.setScale(1);
      onPress();
    });
  });

  return plate;
};
