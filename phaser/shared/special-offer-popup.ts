import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {layoutScaleForViewport} from "@/settings/app-header-layout";
import {playClick} from "@/settings/click";
import type {BoosterId} from "@/settings/boosters";
import {
  canRequestRewardedInterstitial,
  showRewardedInterstitial,
} from "@/settings/rewarded-interstitials";
import {
  getSpecialOfferAdProgress,
  recordSpecialOfferAdCompleted,
  SPECIAL_OFFER_ADS_REQUIRED,
  type SpecialOfferPending,
} from "@/settings/special-offer";
import {CandyCrushAssetConf} from "./config/asset-conf.const";
import {APP_FONT} from "./config/font.const";
import {animatePopupClose, animatePopupOpen} from "./popup-motion";
import {stylePopupBody, stylePopupTitle} from "./popup-text";

const assetConf = CandyCrushAssetConf;
const PLATE_KEY = "popupShopMarket";

const TITLE_FONT_MIN = 58;
const TITLE_FONT_MAX = 76;
const BODY_FONT_MIN = 44;
const BODY_FONT_MAX = 58;
const TITLE_BODY_GAP_RATIO = 0.035;
const ITEMS_GAP_RATIO = 0.04;
const BODY_ITEMS_GAP_RATIO = 0.035;
const ITEMS_WATCH_GAP_RATIO = 0.045;
const BUTTON_WIDTH_RATIO = 0.74;

export type SpecialOfferPopup = {
  close: () => void;
};

type Options = {
  offer: SpecialOfferPending;
  scale: number;
  textScale?: number;
  onGranted: () => void;
  onForfeit: () => void;
};

const fontPx = (scene: Phaser.Scene, min: number, max: number): number => {
  const {width, height} = scene.scale;

  return layoutScaleForViewport(width, height, min, max);
};

const boosterTexture = (id: BoosterId): string => assetConf.image[id];

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

export const showSpecialOfferPopup = (
  scene: Phaser.Scene,
  options: Options,
): SpecialOfferPopup | null => {
  if (!scene.textures.exists(PLATE_KEY)) return null;

  const {width, height} = scene.scale;
  const scale = options.scale;
  const textScale = options.textScale ?? 0.88;
  const language = getCurrentLanguage();
  const adsRequired = SPECIAL_OFFER_ADS_REQUIRED;

  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
    .setDepth(40)
    .setScrollFactor(0);
  const blocker = scene.add
    .rectangle(width / 2, height / 2, width, height, 0xffffff, 0.001)
    .setScrollFactor(0)
    .setDepth(41)
    .setInteractive({useHandCursor: false});

  const plate = scene.add.image(0, 0, PLATE_KEY).setOrigin(0.5);
  const wrap = plate.width * 0.82;
  const popup = scene.add.container(width / 2, height / 2).setDepth(42).setScrollFactor(0);

  const titleSize = fontPx(scene, TITLE_FONT_MIN, TITLE_FONT_MAX) * textScale;
  const bodySize = fontPx(scene, BODY_FONT_MIN, BODY_FONT_MAX) * textScale;

  const title = scene.add
    .text(0, 0, t("specialOfferTitle", language), {
      fontFamily: APP_FONT,
      fontSize: `${titleSize}px`,
      align: "center",
      wordWrap: {width: wrap},
    })
    .setOrigin(0.5);

  const body = scene.add
    .text(0, 0, t("specialOfferBody", language), {
      fontFamily: APP_FONT,
      fontSize: `${bodySize}px`,
      align: "center",
      wordWrap: {width: wrap},
    })
    .setOrigin(0.5);

  stylePopupTitle(title, titleSize);
  stylePopupBody(body, bodySize);

  const iconSize = plate.width * 0.11;
  const iconGap = iconSize * 0.12;
  const iconsRow = scene.add.container(0, 0);

  options.offer.items.forEach((id, index) => {
    const key = boosterTexture(id);

    if (!scene.textures.exists(key)) return;

    const icon = scene.add.image(0, 0, key).setDisplaySize(iconSize, iconSize);

    icon.x = (index - (options.offer.items.length - 1) / 2) * (iconSize + iconGap);
    iconsRow.add(icon);
  });

  const labelFont = fontPx(scene, 40, 52) * textScale;
  const words = t("shopAdsNeeded", language);
  const number = scene.add
    .text(0, 0, String(adsRequired), {
      fontFamily: APP_FONT,
      fontSize: `${labelFont}px`,
    })
    .setOrigin(1, 0.5);
  const phrase = scene.add
    .text(0, 0, ` ${words}`, {
      fontFamily: APP_FONT,
      fontSize: `${labelFont}px`,
    })
    .setOrigin(0, 0.5);

  stylePopupBody(number, labelFont);
  stylePopupBody(phrase, labelFont);

  const labelW = number.width + phrase.width;

  number.setX(-labelW / 2 + number.width);
  phrase.setX(number.x);

  const watchRadius = Math.round(fontPx(scene, 72, 96) * textScale);
  const clock = scene.add.graphics();
  const ratioStart = options.offer.adsWatched / adsRequired;

  clock.setPosition(0, 0);
  paintClock(clock, watchRadius, ratioStart);
  ensureTvTexture(scene);

  const tvIcon = scene.textures.exists(TV_KEY)
    ? scene.add.image(0, 0, TV_KEY).setDisplaySize(watchRadius * 1.05, watchRadius * 1.05)
    : null;

  const watchBlockH = labelFont + watchRadius * 2.4;
  const watchChildren: Phaser.GameObjects.GameObject[] = [number, phrase, clock];

  if (tvIcon) watchChildren.push(tvIcon);

  const watchRoot = scene.add.container(0, 0, watchChildren);

  number.setY(-watchBlockH / 2 + labelFont / 2);
  phrase.setY(number.y);
  clock.setY(watchBlockH / 2 - watchRadius);
  tvIcon?.setY(clock.y);

  const titleGap = plate.height * TITLE_BODY_GAP_RATIO;
  const bodyItemsGap = plate.height * BODY_ITEMS_GAP_RATIO;
  const itemsWatchGap = plate.height * ITEMS_WATCH_GAP_RATIO;
  const totalH =
    title.height +
    titleGap +
    body.height +
    bodyItemsGap +
    iconSize +
    itemsWatchGap +
    watchBlockH;
  let y = -totalH / 2;

  title.setY(y + title.height / 2);
  y += title.height + titleGap;
  body.setY(y + body.height / 2);
  y += body.height + bodyItemsGap;
  iconsRow.setY(y + iconSize / 2);
  y += iconSize + itemsWatchGap;
  watchRoot.setY(y + watchBlockH / 2);

  popup.add([plate, title, body, iconsRow, watchRoot]);
  popup.setScale(scale);

  const watchHit = scene.add
    .rectangle(
      width / 2,
      height / 2 + watchRoot.y * scale,
      watchRadius * 2.4 * scale,
      watchRadius * 2.4 * scale,
      0xffffff,
      0.001,
    )
    .setScrollFactor(0)
    .setDepth(43)
    .setInteractive({useHandCursor: true});

  let closing = false;
  let watching = false;
  let clockRatio = ratioStart;
  let clockTween: Phaser.Tweens.Tween | null = null;

  const redrawClock = (ratio: number) => paintClock(clock, watchRadius, ratio);

  let forfeited = false;

  const destroyAll = () => {
    clockTween?.stop();
    blocker.off("pointerup", onOutsideUp);
    watchHit.off("pointerdown", onWatchPress);
    overlay.destroy(true);
    blocker.destroy(true);
    watchHit.destroy(true);
    popup.destroy(true);
  };

  const close = (forfeit: boolean) => {
    if (closing) return;

    closing = true;
    watchHit.disableInteractive();

    if (forfeit && !forfeited) {
      forfeited = true;
      options.onForfeit();
    }

    animatePopupClose(scene, popup, scale, [overlay, blocker, watchHit], destroyAll);
  };

  const animateClockTo = (to: number, onDone?: () => void) => {
    const from = clockRatio;

    clockTween?.stop();
    clockTween = scene.tweens.add({
      targets: {ratio: from},
      ratio: to,
      duration: from === to ? 0 : 480,
      ease: "Sine.easeOut",
      onUpdate: (_t, target) => {
        clockRatio = (target as {ratio: number}).ratio;
        redrawClock(clockRatio);
      },
      onComplete: () => {
        clockRatio = to;
        redrawClock(to);
        onDone?.();
      },
    });
  };

  const onWatchPress = (
    _pointer: Phaser.Input.Pointer,
    _x: number,
    _y: number,
    event: Phaser.Types.Input.EventData,
  ) => {
    event.stopPropagation();

    if (closing || watching) return;

    playClick();

    const afterAd = () => {
      const granted = recordSpecialOfferAdCompleted();
      const progress = getSpecialOfferAdProgress();
      const to = granted ? 1 : progress / adsRequired;

      animateClockTo(to, () => {
        watching = false;

        if (granted) {
          options.onGranted();
          close(false);

          return;
        }

        watchHit.setInteractive({useHandCursor: true});
      });
    };

    if (!canRequestRewardedInterstitial()) {
      watching = true;
      afterAd();

      return;
    }

    watching = true;
    watchHit.disableInteractive();

    void showRewardedInterstitial("bonusItems").then((earned) => {
      if (closing || !popup.active) {
        watching = false;

        return;
      }

      if (!earned) {
        watching = false;
        watchHit.setInteractive({useHandCursor: true});

        return;
      }

      afterAd();
    });
  };

  const onOutsideUp = () => {
    if (!popup.active || closing || watching) return;

    close(true);
  };

  watchHit.on("pointerdown", onWatchPress);
  blocker.on("pointerup", onOutsideUp);
  animatePopupOpen(scene, popup, scale, [overlay, blocker]);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => clockTween?.stop());

  return {
    close: () => close(true),
  };
};
