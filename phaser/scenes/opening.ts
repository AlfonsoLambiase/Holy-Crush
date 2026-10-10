import * as Phaser from "phaser";

import {getCurrentLanguage, openingTextKey, t} from "@/language";
import {cappedDevicePixelRatio} from "@/settings/app-header-layout";
import {getStageIndex} from "@/settings/progress";
import {playStageTrack} from "@/settings/soundtrack";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {EventBus, PhaserEvents} from "../shared/event-bus";
import {DEFAULT_STAGE} from "../shared/config/asset-paths.const";
import {APP_FONT} from "../shared/config/font.const";
import {loadOpeningBootAssets, purgeOpeningTextures} from "../shared/utils/load-assets";

const assetConf = CandyCrushAssetConf;

const TYPE_SPEED_MS = 55;
const RAY_COUNT = 9;
const SKY_TOP = 0x1a4f86;
const SKY_HORIZON = 0xf3d7a2;
const GOLD = 0xffd76a;
const PANEL_HEIGHT_RATIO = 0.3;
const PANEL_BOTTOM_MARGIN_RATIO = 0.035;
const PANEL_WIDTH_RATIO = 0.86;
/** Layout contain + bleed: soglie in px CSS (Phaser scale = fisici × DPR). */
const OPENING_TABLET_MIN_CSS_SHORT = 640;
const OPENING_TABLET_MIN_CSS_LONG = 900;

export class OpeningScene extends Phaser.Scene {
  #body!: Phaser.GameObjects.Text;
  #footer!: Phaser.GameObjects.Text;
  #fullText = "";
  #typeEvent?: Phaser.Time.TimerEvent;
  #rayTweens: Phaser.Tweens.Tween[] = [];
  #rayMasks: Phaser.Display.Masks.GeometryMask[] = [];
  #isComplete = false;

  constructor() {
    super({key: assetConf.scene.opening});
  }

  preload() {
    const stage = Number(this.registry.get("stage")) || DEFAULT_STAGE;

    loadOpeningBootAssets(this, stage);
  }

  create() {
    const {width, height} = this.scale;
    const stage = Number(this.registry.get("stage")) || DEFAULT_STAGE;
    const language = getCurrentLanguage();
    const key = openingTextKey(stage);
    const translated = t(key, language);
    const copy = translated === key ? t("opening_0", language) : translated;
    const dpr = cappedDevicePixelRatio();
    const cssShort = Math.min(width, height) / dpr;
    const cssLong = Math.max(width, height) / dpr;
    const tallOpeningLayout =
      cssShort >= OPENING_TABLET_MIN_CSS_SHORT && cssLong >= OPENING_TABLET_MIN_CSS_LONG;
    const aspect = width / Math.max(height, 1);
    const fontSize = Math.round(
      tallOpeningLayout
        ? Phaser.Math.Clamp(Math.min(width * 0.042, height * 0.034), 22, aspect > 0.72 ? 48 : 58)
        : Phaser.Math.Clamp(width * 0.042, 26, 58),
    );

    this.#isComplete = false;
    if (tallOpeningLayout) this.cameras.main.setBackgroundColor(SKY_TOP);
    playStageTrack(getStageIndex());

    let panelW: number;
    let panelH: number;
    let panelY: number;
    let art: Phaser.GameObjects.Image;

    if (tallOpeningLayout) {
      panelW = width * PANEL_WIDTH_RATIO;
      panelH = height * PANEL_HEIGHT_RATIO;
      panelY = height - height * PANEL_BOTTOM_MARGIN_RATIO - panelH / 2;
      art = this.#placeArtTablet(width, height, panelY - panelH / 2);
    } else {
      art = this.#placeArt(width, height);
      panelW = width * 0.86;
      panelH = Math.min(height * 0.3, art.displayHeight * 0.36);
      panelY = art.y + art.displayHeight / 2 - panelH * 0.62;
    }

    this.add
      .rectangle(width / 2, panelY, panelW, panelH, 0x140d2d, 0.72)
      .setStrokeStyle(3, GOLD, 0.85)
      .setDepth(4);

    this.#body = this.add
      .text(width / 2, panelY - fontSize * 0.35, copy, {
        align: "center",
        color: "#fff8dc",
        fontFamily: APP_FONT,
        fontSize: `${fontSize}px`,
        lineSpacing: Math.round(fontSize * 0.28),
        wordWrap: {width: panelW * 0.9, useAdvancedWrap: true},
        stroke: "#1a1208",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.#fullText = this.#body.getWrappedText().join("\n");
    this.#body.setText(this.#fullText);
    this.#body.setFixedSize(this.#body.width, this.#body.height);
    this.#body.setText("");

    this.#footer = this.add
      .text(width / 2, panelY + panelH / 2 - fontSize * 0.7, t("tapToContinue", language), {
        color: "#ffd76a",
        fontFamily: APP_FONT,
        fontSize: `${Math.round(fontSize * 0.48)}px`,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(5);

    this.#startTyping();
    this.input.on("pointerup", this.#advance, this);
    EventBus.emit(PhaserEvents.OPENING_READY);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#typeEvent?.remove();
      this.#rayTweens.forEach((tween) => tween.remove());
      this.#rayMasks.forEach((mask) => mask.destroy());
      this.input.off("pointerup", this.#advance, this);

      const textures = this.textures;

      this.game.events.once(Phaser.Core.Events.POST_RENDER, () => {
        for (const key of ["opening-ray", "opening-glow"]) {
          if (textures.exists(key)) textures.remove(key);
        }

        purgeOpeningTextures(textures);
      });
    });
  }

  //* Immagine centrata, larga quanto lo schermo. Il riflesso esce sopra e, capovolto, sotto.
  #placeArt(width: number, height: number): Phaser.GameObjects.Image {
    const art = this.add
      .image(width / 2, height / 2, assetConf.image.opening)
      .setOrigin(0.5)
      .setDepth(2);

    art.setScale(width / art.width);

    const gap = (height - art.displayHeight) / 2;

    if (gap <= 2) return art;

    const top = gap;
    const bottom = height - gap;
    const lineH = this.#placeLines(width, top, bottom);
    const outer = Math.max(0, gap - lineH);

    this.#addSky(width, top, bottom);

    if (outer > 2) {
      this.#addRays(width / 2, top - lineH, outer + 48, false);
      this.#addRays(width / 2, bottom + lineH, outer + 48, true);
    }

    return art;
  }

  //* Tablet: fit nello spazio sopra il pannello (evita taglio testo su viewport larghi).
  #placeArtTablet(width: number, height: number, panelTopY: number): Phaser.GameObjects.Image {
    const art = this.add
      .image(width / 2, height / 2, assetConf.image.opening)
      .setOrigin(0.5)
      .setDepth(2);

    const topMargin = height * 0.02;
    const maxArtBottom = Math.max(topMargin + 8, panelTopY - height * 0.015);
    const maxArtHeight = Math.max(64, maxArtBottom - topMargin);
    const scale = Math.min(width / art.width, maxArtHeight / art.height);

    art.setScale(scale);
    art.setY(topMargin + maxArtHeight / 2);

    const artTop = art.y - art.displayHeight / 2;
    const artBottom = art.y + art.displayHeight / 2;
    const artLeft = art.x - art.displayWidth / 2;
    const artRight = art.x + art.displayWidth / 2;

    const top = Math.max(0, artTop);
    const bottom = Math.min(height, artBottom);
    const lineH = this.#placeLines(width, top, bottom);
    const outerTop = Math.max(0, top - lineH);
    const outerBottom = Math.max(0, height - bottom - lineH);

    this.#addSky(width, top, bottom);

    if (outerTop > 2) {
      this.#addRays(width / 2, top - lineH, outerTop + 48, false);
    }

    if (outerBottom > 2) {
      this.#addRays(width / 2, bottom + lineH, outerBottom + 48, true);
    }

    this.#fillTabletBleed(width, artTop, artBottom, artLeft, artRight, panelTopY);

    return art;
  }

  /** Bande ai lati + sotto l'op: stessi gradienti di #addSky (non blu piatto). */
  #fillTabletBleed(
    width: number,
    artTop: number,
    artBottom: number,
    artLeft: number,
    artRight: number,
    panelTopY: number,
  ): void {
    const bleed = this.add.graphics().setDepth(0);
    const gapBelowArt = Math.max(0, panelTopY - artBottom);
    const horizonY = (artTop + artBottom) / 2;

    if (gapBelowArt > 1) {
      this.#paintLowerSkyRect(bleed, 0, artBottom, width, gapBelowArt);
    }

    if (artLeft > 1) this.#paintSideSkyPillar(bleed, 0, artLeft, panelTopY, horizonY);
    if (artRight < width - 1) {
      this.#paintSideSkyPillar(bleed, artRight, width - artRight, panelTopY, horizonY);
    }
  }

  #paintSideSkyPillar(
    g: Phaser.GameObjects.Graphics,
    x: number,
    w: number,
    pillarBottomY: number,
    horizonY: number,
  ): void {
    const upperH = Math.max(0, horizonY);
    const lowerH = Math.max(0, pillarBottomY - horizonY);

    if (upperH > 1) this.#paintUpperSkyRect(g, x, 0, w, upperH);
    if (lowerH > 1) this.#paintLowerSkyRect(g, x, horizonY, w, lowerH);
  }

  #paintUpperSkyRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    g.fillGradientStyle(SKY_TOP, SKY_TOP, SKY_HORIZON, SKY_HORIZON, 1);
    g.fillRect(x, y, w, h);
  }

  #paintLowerSkyRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    g.fillGradientStyle(SKY_HORIZON, SKY_HORIZON, SKY_TOP, SKY_TOP, 1);
    g.fillRect(x, y, w, h);
  }

  #placeLines(width: number, top: number, bottom: number): number {
    const key = assetConf.image.line;
    const above = this.add.image(width / 2, top, key).setOrigin(0.5, 1).setDepth(3);
    const below = this.add.image(width / 2, bottom, key).setOrigin(0.5, 0).setDepth(3);

    above.setScale(width / above.width);
    below.setScale(width / below.width);

    return above.displayHeight;
  }

  #addSky(width: number, top: number, bottom: number): void {
    const sky = this.add.graphics().setDepth(0);
    const lowerH = this.scale.height - bottom;

    this.#paintUpperSkyRect(sky, 0, 0, width, top);
    if (lowerH > 0) this.#paintLowerSkyRect(sky, 0, bottom, width, lowerH);
  }

  #addRays(x: number, y: number, reach: number, flip: boolean): void {
    const rays = this.add.container(x, y).setDepth(1);
    const maskGraphics = this.make.graphics({x: 0, y: 0});
    const beamKey = this.#softBeamTexture();

    maskGraphics.fillStyle(0xffffff);

    if (flip) maskGraphics.fillRect(0, y, this.scale.width, this.scale.height - y);
    else maskGraphics.fillRect(0, 0, this.scale.width, y);

    const mask = maskGraphics.createGeometryMask();

    this.#rayMasks.push(mask);
    rays.setMask(mask);

    if (flip) rays.setScale(1, -1);

    const glow = this.add
      .image(0, 0, this.#softGlowTexture())
      .setOrigin(0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.85)
      .setDisplaySize(this.scale.width * 0.72, reach * 0.9);

    rays.add(glow);

    for (let i = 0; i < RAY_COUNT; i++) {
      const beam = this.add
        .image(0, 0, beamKey)
        .setOrigin(0.5, 1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.28 + (i % 3) * 0.1)
        .setRotation((Math.PI * 2 * i) / RAY_COUNT);

      const spread = this.scale.width * (0.16 + (i % 3) * 0.07);

      beam.setDisplaySize(spread, reach * (0.82 + (i % 2) * 0.18));
      rays.add(beam);
    }

    this.#rayTweens.push(
      this.tweens.add({
        targets: rays,
        angle: 360,
        duration: 36000,
        repeat: -1,
      }),
    );
  }

  #softBeamTexture(): string {
    const key = "opening-ray";

    if (this.textures.exists(key)) return key;

    const width = 220;
    const height = 640;
    const canvas = this.textures.createCanvas(key, width, height);

    if (!canvas) return key;

    const ctx = canvas.getContext() as CanvasRenderingContext2D;
    const along = ctx.createLinearGradient(width / 2, height, width / 2, 0);

    along.addColorStop(0, "rgba(255, 250, 230, 0.9)");
    along.addColorStop(0.22, "rgba(255, 236, 186, 0.38)");
    along.addColorStop(0.62, "rgba(255, 226, 160, 0.08)");
    along.addColorStop(1, "rgba(255, 226, 160, 0)");
    ctx.fillStyle = along;
    ctx.beginPath();
    ctx.moveTo(width / 2, height);
    ctx.quadraticCurveTo(width * 0.2, height * 0.4, 0, 0);
    ctx.lineTo(width, 0);
    ctx.quadraticCurveTo(width * 0.8, height * 0.4, width / 2, height);
    ctx.fill();

    ctx.globalCompositeOperation = "destination-in";
    const across = ctx.createLinearGradient(0, 0, width, 0);

    across.addColorStop(0, "rgba(0,0,0,0)");
    across.addColorStop(0.5, "rgba(0,0,0,1)");
    across.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = across;
    ctx.fillRect(0, 0, width, height);
    canvas.refresh();

    return key;
  }

  #softGlowTexture(): string {
    const key = "opening-glow";

    if (this.textures.exists(key)) return key;

    const size = 320;
    const canvas = this.textures.createCanvas(key, size, size);

    if (!canvas) return key;

    const ctx = canvas.getContext() as CanvasRenderingContext2D;
    const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

    glow.addColorStop(0, "rgba(255, 248, 220, 0.95)");
    glow.addColorStop(0.28, "rgba(255, 226, 160, 0.32)");
    glow.addColorStop(1, "rgba(255, 226, 160, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
    canvas.refresh();

    return key;
  }

  #startTyping(): void {
    let visible = 0;

    this.#typeEvent = this.time.addEvent({
      delay: TYPE_SPEED_MS,
      repeat: Math.max(0, this.#fullText.length - 1),
      callback: () => {
        visible++;
        this.#body.setText(this.#fullText.slice(0, visible));

        if (visible >= this.#fullText.length) this.#completeTyping();
      },
    });
  }

  #completeTyping(): void {
    if (this.#isComplete) return;

    this.#isComplete = true;
    this.#typeEvent?.remove();
    this.#body.setText(this.#fullText);
    this.tweens.add({targets: this.#footer, alpha: 1, duration: 400, ease: "Sine.easeOut"});
  }

  #advance = (): void => {
    if (!this.#isComplete) {
      this.#completeTyping();

      return;
    }

    this.scene.start(assetConf.scene.stageMap);
  };
}
