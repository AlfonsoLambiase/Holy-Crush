import * as Phaser from "phaser";

import {getCurrentLanguage, openingTextKey, t} from "@/language";
import {playTrack} from "@/settings/soundtrack";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {DEFAULT_STAGE} from "../shared/config/asset-paths.const";
import {APP_FONT} from "../shared/config/font.const";

const assetConf = CandyCrushAssetConf;

const TYPE_SPEED_MS = 55;

export class OpeningScene extends Phaser.Scene {
  #body!: Phaser.GameObjects.Text;
  #footer!: Phaser.GameObjects.Text;
  #fullText = "";
  #typeEvent?: Phaser.Time.TimerEvent;
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

    this.add
      .image(width / 2, height / 2, assetConf.image.opening)
      .setDisplaySize(width, height)
      .setDepth(0);

    const panelW = width * 0.86;
    const panelH = height * 0.3;
    const panelY = height * 0.78;

    this.add
      .rectangle(width / 2, panelY, panelW, panelH, 0x140d2d, 0.72)
      .setStrokeStyle(3, 0xffd76a, 0.85)
      .setDepth(1);

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
      .setDepth(2);

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
      .setDepth(2);

    this.#startTyping();
    this.input.on("pointerup", this.#advance, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.#typeEvent?.remove();
      this.input.off("pointerup", this.#advance, this);
    });
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
