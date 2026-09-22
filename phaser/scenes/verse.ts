import * as Phaser from "phaser";

import {getVerseByStage} from "../components/verse";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {DEFAULT_STAGE} from "../shared/config/asset-paths.const";

const assetConf = CandyCrushAssetConf;

const TYPE_SPEED_MS = 55; // ritmo di scrittura del versetto

export class VerseScene extends Phaser.Scene {
  #verseText!: Phaser.GameObjects.Text;
  #footer: Phaser.GameObjects.Text[] = [];
  #fullText: string = "";
  #typeEvent?: Phaser.Time.TimerEvent;
  #isComplete: boolean = false;

  constructor() {
    super({key: assetConf.scene.verse});
  }

  create() {
    const {width, height} = this.scale;
    const stage = Number(this.registry.get("stage")) || DEFAULT_STAGE;
    const verse = getVerseByStage(stage);
    const fontSize = Math.round(Phaser.Math.Clamp(width * 0.055, 28, 72));

    this.#isComplete = false;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    this.#verseText = this.add
      .text(width / 2, height / 2, `“${verse.text}”`, {
        align: "center",
        color: "#fff8dc",
        fontFamily: "Paytone One",
        fontSize: `${fontSize}px`,
        lineSpacing: Math.round(fontSize * 0.25),
        wordWrap: {width: width * 0.8, useAdvancedWrap: true},
      })
      .setOrigin(0.5);

    //* Fisso il testo già mandato a capo: così la scrittura non fa saltare le righe
    this.#fullText = this.#verseText.getWrappedText().join("\n");
    this.#verseText.setText(this.#fullText);
    this.#verseText.setFixedSize(this.#verseText.width, this.#verseText.height);
    this.#verseText.setText("");

    const footerTop = height / 2 + this.#verseText.height / 2;

    this.#footer = [
      this.add
        .text(width / 2, footerTop + fontSize, verse.reference, {
          color: "#ffd76a",
          fontFamily: "Paytone One",
          fontSize: `${Math.round(fontSize * 0.7)}px`,
        })
        .setOrigin(0.5)
        .setAlpha(0),
      this.add
        .text(width / 2, footerTop + fontSize * 2.6, "TOCCA PER CONTINUARE", {
          color: "#fff8dc",
          fontFamily: "Paytone One",
          fontSize: `${Math.round(fontSize * 0.45)}px`,
        })
        .setOrigin(0.5)
        .setAlpha(0),
    ];

    this.#startTyping();

    this.input.on("pointerup", () => this.#advance());
  }

  #startTyping(): void {
    let visible = 0;

    this.#typeEvent = this.time.addEvent({
      delay: TYPE_SPEED_MS,
      repeat: this.#fullText.length - 1,
      callback: () => {
        visible++;
        this.#verseText.setText(this.#fullText.slice(0, visible));

        if (visible >= this.#fullText.length) this.#completeTyping();
      },
    });
  }

  //* Mostra subito tutto il versetto e sblocca il passaggio al gioco
  #completeTyping(): void {
    if (this.#isComplete) return;

    this.#isComplete = true;
    this.#typeEvent?.remove();
    this.#verseText.setText(this.#fullText);

    this.tweens.add({
      targets: this.#footer,
      alpha: 1,
      duration: 400,
      ease: "Sine.easeOut",
    });
  }

  #advance(): void {
    if (!this.#isComplete) {
      this.#completeTyping();

      return;
    }

    this.scene.start(assetConf.scene.game);
  }
}
