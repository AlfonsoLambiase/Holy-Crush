import * as Phaser from "phaser";

import {getCurrentLanguage, openingTextKey, t} from "@/language";
import {playTrack} from "@/settings/soundtrack";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {DEFAULT_STAGE} from "../shared/config/asset-paths.const";
import {APP_FONT} from "../shared/config/font.const";

const assetConf = CandyCrushAssetConf;

const TYPE_SPEED_MS = 55;
const RAY_COUNT = 9;
const SKY_TOP = 0x1a4f86;
const SKY_HORIZON = 0xf3d7a2;
const GOLD = 0xffd76a;

export class OpeningScene extends Phaser.Scene {
  #body!: Phaser.GameObjects.Text;
  #footer!: Phaser.GameObjects.Text;
  #fullText = "";
  #typeEvent?: Phaser.Time.TimerEvent;
  #rayTween?: Phaser.Tweens.Tween;
  #rayMask?: Phaser.Display.Masks.GeometryMask;
  #isComplete = false;

  constructor() {
    super({key: assetConf.scene.opening});
  }

  create() {
    const {width, height} = this.scale;
    const stage = Number(this.registry.get("stage")) || DEFAULT_STAGE;
    const language = getCurrentLanguage();
    const key = openingTextKey(stage);
    const translated = t(key, language);
    const copy = translated === key ? t("opening_0", language) : translated;
    const fontSize = Math.round(Phaser.Math.Clamp(width * 0.042, 26, 58));

    this.#isComplete = false;
    playTrack("stage");
    this.#placeArt(width, height);

    const panelW = width * 0.86;
    const panelH = height * 0.3;
    const panelY = height * 0.78;

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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#typeEvent?.remove();
      this.#rayTween?.remove();
      this.#rayMask?.destroy();
      this.input.off("pointerup", this.#advance, this);
    });
  }

  //* Immagine a larghezza schermo, pivot in basso al centro. Sopra, se avanza spazio, cielo e raggi.
  #placeArt(width: number, height: number): void {
    const art = this.add
      .image(width / 2, height, assetConf.image.opening)
      .setOrigin(0.5, 1)
      .setDepth(2);

    art.setScale(width / art.width);

    const gap = height - art.displayHeight;

    if (gap <= 2) return;

    this.#addSky(width, gap);
    this.#addRays(width / 2, gap, gap + 48);
    this.add.rectangle(width / 2, gap, width, 3, GOLD, 0.95).setDepth(3);
  }

  #addSky(width: number, gap: number): void {
    const sky = this.add.graphics().setDepth(0);

    sky.fillGradientStyle(SKY_TOP, SKY_TOP, SKY_HORIZON, SKY_HORIZON, 1);
    sky.fillRect(0, 0, width, gap);
  }

  #addRays(x: number, y: number, reach: number): void {
    const rays = this.add.container(x, y).setDepth(1);
    const maskGraphics = this.make.graphics({x: 0, y: 0});
    const beamKey = this.#softBeamTexture();

    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(0, 0, this.scale.width, y);
    this.#rayMask = maskGraphics.createGeometryMask();
    rays.setMask(this.#rayMask);

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

    this.#rayTween = this.tweens.add({
      targets: rays,
      angle: 360,
      duration: 36000,
      repeat: -1,
    });
  }

  #softBeamTexture(): string {
    const key = "opening-ray";

    if (this.textures.exists(key)) this.textures.remove(key);

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

    if (this.textures.exists(key)) this.textures.remove(key);

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
