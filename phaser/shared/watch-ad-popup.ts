import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {layoutScaleForViewport} from "@/settings/app-header-layout";
import {playClick} from "@/settings/click";
import {getShopAdProgress, SHOP_AD_COST, watchShopAd, type ShopAdId} from "@/settings/shop-ads";
import {CandyCrushAssetConf} from "./config/asset-conf.const";
import {APP_FONT} from "./config/font.const";
import {animatePopupClose, animatePopupOpen} from "./popup-motion";
import {stylePopupBody, stylePopupTitle} from "./popup-text";

const assetConf = CandyCrushAssetConf;

//* Stessi estremi del titolo exit/reload.
const TITLE_FONT_MIN = 64;
const TITLE_FONT_MAX = 82;
const BODY_FONT_MIN = 56;
const BODY_FONT_MAX = 72;
const TITLE_BODY_GAP_RATIO = 0.04;
const BODY_BUTTON_GAP_RATIO = 0.05;
const BUTTON_WIDTH_RATIO = 0.74;

export type WatchAdPopup = {
  close: () => void;
};

type WatchAdPopupOptions = {
  title: string;
  body: string;
  scale: number;
  adId: ShopAdId;
  /** 1 = booster. Sotto 1 rimpicciolisce testi e cerchio insieme. */
  textScale?: number;
  dim?: number;
  hideAdLabel?: boolean;
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
    .rectangle(width / 2, height / 2, width, height, 0x000000, options.dim ?? 0.55)
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
  const titleSize = fontPx(scene, TITLE_FONT_MIN, TITLE_FONT_MAX) * textScale;
  const bodySize = fontPx(scene, BODY_FONT_MIN, BODY_FONT_MAX) * textScale;
  const title = scene.add
    .text(0, 0, options.title, {
      fontFamily: APP_FONT,
      fontSize: `${titleSize}px`,
      align: "center",
      wordWrap: {width: wrap},
    })
    .setOrigin(0.5);
  const body = scene.add
    .text(0, 0, options.body, {
      fontFamily: APP_FONT,
      fontSize: `${bodySize}px`,
      align: "center",
      wordWrap: {width: wrap},
    })
    .setOrigin(0.5);

  stylePopupTitle(title, titleSize);
  stylePopupBody(body, bodySize);
  const watch = addWatchVisual(
    scene,
    options.adId,
    textScale,
    plate.width * BUTTON_WIDTH_RATIO,
    options.hideAdLabel,
  );

  const titleGap = plate.height * TITLE_BODY_GAP_RATIO;
  const watchGap = plate.height * BODY_BUTTON_GAP_RATIO;
  const top = -(title.height + titleGap + body.height + watchGap + watch.height) / 2;

  title.setY(top + title.height / 2);
  body.setY(title.y + title.height / 2 + titleGap + body.height / 2);

  const watchY = body.y + body.height / 2 + watchGap + watch.height / 2;

  watch.root.setY(watchY);

  let consumed = false;
  let closing = false;

  popup.add([plate, title, body, watch.root]);
  popup.setScale(scale);

  //* Hit separato dal container scalato: in Phaser il touch sui figli annidati spesso non arriva
  const watchHit = scene.add
    .rectangle(
      width / 2,
      height / 2 + (watchY + watch.hitOffsetY) * scale,
      watch.hitSize * scale,
      watch.hitSize * scale,
      0xffffff,
      0.001,
    )
    .setScrollFactor(0)
    .setDepth(43)
    .setInteractive({useHandCursor: true});

  const dismissTargets: Phaser.GameObjects.GameObject[] = [popup, overlay, blocker, watchHit];

  const destroyAll = () => {
    watch.stop();
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

  const onWatchPress = (
    _pointer: Phaser.Input.Pointer,
    _x: number,
    _y: number,
    event: Phaser.Types.Input.EventData,
  ) => {
    event.stopPropagation();

    if (consumed || closing) return;

    playClick();
    watch.advance(
      () => {
        if (consumed) return;

        consumed = true;

        try {
          options.onWatch();
        } catch {
          consumed = false;
        }
      },
      () => close(),
    );
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

const TV_KEY = "watch-ad-tv";
const TV_PATH =
  "M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8a2 2 0 0 0-2-2m0 14H3V8h18zM9 10v8l7-4z";

const ensureTvTexture = (scene: Phaser.Scene) => {
  if (scene.textures.exists(TV_KEY)) return;

  const size = 128;
  const canvas = document.createElement("canvas");

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = "#ffffff";
  ctx.fill(new Path2D(TV_PATH));
  scene.textures.addCanvas(TV_KEY, canvas);
};

const paintClock = (graphics: Phaser.GameObjects.Graphics, radius: number, ratio: number) => {
  graphics.clear();
  graphics.fillStyle(0x1a0f08, 1);
  graphics.fillCircle(0, 0, radius);

  const fill = Math.min(1, Math.max(0, ratio));

  if (fill >= 0.999) {
    graphics.fillStyle(0x5c3a14, 1);
    graphics.fillCircle(0, 0, radius);
  } else if (fill > 0) {
    const start = -Math.PI / 2;

    graphics.fillStyle(0x5c3a14, 1);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.arc(0, 0, radius, start, start + Math.PI * 2 * fill, false);
    graphics.closePath();
    graphics.fillPath();
  }

  graphics.lineStyle(Math.max(4, radius * 0.045), 0xe0c36a, 0.55);
  graphics.strokeCircle(0, 0, radius);
};

const addWatchLabels = (
  scene: Phaser.Scene,
  ads: number,
  textScale: number,
  maxWidth: number,
): {
  number: Phaser.GameObjects.Text;
  phrase: Phaser.GameObjects.Text;
  width: number;
  height: number;
} => {
  const language = getCurrentLanguage();
  const words = ads === 1 ? t("shopAdNeeded", language) : t("shopAdsNeeded", language);
  let fontSize = fontPx(scene, 44, 58) * textScale;
  const number = scene.add
    .text(0, 0, String(ads), {
      fontFamily: APP_FONT,
      fontSize: `${fontSize}px`,
    })
    .setOrigin(1, 0.5);
  const phrase = scene.add
    .text(0, 0, ` ${words}`, {
      fontFamily: APP_FONT,
      fontSize: `${fontSize}px`,
    })
    .setOrigin(0, 0.5);

  while (number.width + phrase.width > maxWidth && fontSize > 32) {
    fontSize -= 2;
    number.setFontSize(`${fontSize}px`);
    phrase.setFontSize(`${fontSize}px`);
  }

  stylePopupBody(number, fontSize);
  stylePopupBody(phrase, fontSize);

  const width = number.width + phrase.width;

  number.setX(-width / 2 + number.width);
  phrase.setX(number.x);

  return {number, phrase, width, height: number.height};
};

const addWatchVisual = (
  scene: Phaser.Scene,
  adId: ShopAdId,
  textScale: number,
  maxWidth: number,
  hideAdLabel = false,
): {
  root: Phaser.GameObjects.Container;
  width: number;
  height: number;
  hitOffsetY: number;
  hitSize: number;
  advance: (onDone: () => void, onFilled: () => void) => void;
  stop: () => void;
} => {
  const ads = SHOP_AD_COST[adId];
  const radius = Math.round(fontPx(scene, 88, 118) * textScale);
  const labels = hideAdLabel ? null : addWatchLabels(scene, ads, textScale, maxWidth);
  const gap = labels ? Math.round(radius * 0.22) : 0;
  const blockH = (labels?.height ?? 0) + gap + radius * 2;
  const circleY = blockH / 2 - radius;

  if (labels) {
    const labelY = -blockH / 2 + labels.height / 2;

    labels.number.setY(labelY);
    labels.phrase.setY(labelY);
  }

  const clock = scene.add.graphics();

  clock.setPosition(0, circleY);
  paintClock(clock, radius, getShopAdProgress()[adId] / ads);
  ensureTvTexture(scene);

  const icon = scene.textures.exists(TV_KEY)
    ? scene.add.image(0, circleY, TV_KEY).setDisplaySize(radius * 1.05, radius * 1.05)
    : null;
  const state = {ratio: getShopAdProgress()[adId] / ads};
  let tween: Phaser.Tweens.Tween | null = null;
  const redraw = (ratio: number) => paintClock(clock, radius, ratio);
  const advance = (onDone: () => void, onFilled: () => void) => {
    const from = state.ratio;
    const done = watchShopAd(adId, ads);
    const to = done ? 1 : getShopAdProgress()[adId] / ads;

    if (done) onDone();

    tween?.stop();
    tween = scene.tweens.add({
      targets: state,
      ratio: to,
      duration: from === to ? 0 : 480,
      ease: "Sine.easeOut",
      onUpdate: () => redraw(state.ratio),
      onComplete: () => {
        redraw(to);

        if (done) onFilled();
      },
    });
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => tween?.stop());

  return {
    root: scene.add.container(
      0,
      0,
      [clock, icon, labels?.number, labels?.phrase].filter(Boolean) as Phaser.GameObjects.GameObject[],
    ),
    width: Math.max(labels?.width ?? 0, radius * 2),
    height: blockH,
    hitOffsetY: circleY,
    hitSize: radius * 2,
    advance,
    stop: () => tween?.stop(),
  };
};
