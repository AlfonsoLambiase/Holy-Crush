import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import {getStageIndex} from "@/settings/progress";
import {APP_FONT} from "../shared/config/font.const";
import {POPUP_OPEN_MS} from "../shared/popup-motion";
import {
  addStoryPanel,
  isTallStoryLayout,
  STORY_PANEL_ART_RATIO,
  STORY_PANEL_BOTTOM_MARGIN_RATIO,
  STORY_PANEL_HEIGHT_RATIO,
  STORY_PANEL_WIDTH_RATIO,
  storyFontSize,
} from "../shared/story-panel";
import {TUTORIAL_PAGES} from "./tutorial-text";

const STORAGE_KEY = "holy-crush-tutorial-seen";
//* Sopra il menu impostazioni (44-48) e la barra booster.
const DEPTH = 60;
const OVERLAY_ALPHA = 0.72;
//* Stesso ingombro della miniatura in fondo alla mappa.
const IMAGE_MAX_WIDTH = 0.65;
const IMAGE_MAX_HEIGHT = 0.55;
const IMAGE_TOP_MARGIN = 0.02;
//* Distanza dal bordo destro: il personaggio esce dal pannello, non dal bordo schermo.
const IMAGE_RIGHT_INSET = 0.14;
const RISE_MS = 700;
const YOUR_TURN_SCALE = 2.2;
const YOUR_TURN_HOLD_MS = 1100;

export type PageOptions = {
  //* Il pannello sale fino a centro pagina, il personaggio lo segue.
  rise?: boolean;
  //* Dopo il tocco lo sfondo resta scuro.
  keepDark?: boolean;
};

const imageKeys = (): string[] => [...new Set(TUTORIAL_PAGES.map((page) => page.image))];

const isSeen = (): boolean =>
  typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";

export const shouldShowTutorial = (level: number): boolean =>
  level === 1 && getStageIndex() === 0 && !isSeen();

const pageText = (index: number): string => {
  const {text} = TUTORIAL_PAGES[index];

  return text[getCurrentLanguage()] || text.it;
};

//* Oscuramento condiviso dalle pagine: resta acceso tra l'ultima pagina e "TOCCA A TE!".
export class TutorialScreen {
  #overlay: Phaser.GameObjects.Rectangle | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  async customPage(imageKey: string, text: string, options: PageOptions = {}): Promise<void> {
    await this.#loadImages([imageKey]);

    const {scene} = this;
    const {width, height} = scene.scale;
    const overlay = this.#showOverlay();

    const image = scene.add
      .image(width * (1 - IMAGE_RIGHT_INSET), height, imageKey)
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setAlpha(0);

    image.setScale(
      Math.min((width * IMAGE_MAX_WIDTH) / image.width, (height * IMAGE_MAX_HEIGHT) / image.height),
    );

    const panelH = isTallStoryLayout(width, height)
      ? height * STORY_PANEL_HEIGHT_RATIO
      : Math.min(height * STORY_PANEL_HEIGHT_RATIO, image.displayHeight * STORY_PANEL_ART_RATIO);
    const panelY = height - height * STORY_PANEL_BOTTOM_MARGIN_RATIO - panelH / 2;
    const panel = addStoryPanel(scene, {
      x: width / 2,
      y: panelY,
      width: width * STORY_PANEL_WIDTH_RATIO,
      height: panelH,
      text,
      depth: DEPTH + 2,
    });
    const layers = [image, ...panel.objects];
    const rise = options.rise ? panel.centerY - height / 2 : 0;
    const panelTop = panel.centerY - panel.height / 2;
    const room = panelTop - rise - height * IMAGE_TOP_MARGIN;

    if (room > 0 && image.displayHeight > room) image.setScale((image.scale * room) / image.displayHeight);

    image.setY(panelTop);

    scene.tweens.add({targets: image, alpha: 1, duration: POPUP_OPEN_MS, ease: "Sine.easeOut"});

    if (options.rise) {
      scene.tweens.add({
        targets: layers,
        y: `-=${rise}`,
        duration: RISE_MS,
        delay: POPUP_OPEN_MS,
        ease: "Cubic.easeOut",
      });
    }

    await new Promise<void>((resolve) => {
      const onTap = () => {
        if (!panel.isComplete()) {
          panel.complete();

          return;
        }

        overlay.off("pointerup", onTap);
        resolve();
      };

      overlay.on("pointerup", onTap);
    });

    await this.#fade(layers, 0);
    panel.destroy();
    image.destroy();
  }

  async page(index: number, options: PageOptions = {}): Promise<void> {
    await this.#loadImages();

    const {scene} = this;
    const {width, height} = scene.scale;
    const overlay = this.#showOverlay();

    const image = scene.add
      .image(width * (1 - IMAGE_RIGHT_INSET), height, TUTORIAL_PAGES[index].image)
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setAlpha(0);

    image.setScale(
      Math.min((width * IMAGE_MAX_WIDTH) / image.width, (height * IMAGE_MAX_HEIGHT) / image.height),
    );

    const panelH = isTallStoryLayout(width, height)
      ? height * STORY_PANEL_HEIGHT_RATIO
      : Math.min(height * STORY_PANEL_HEIGHT_RATIO, image.displayHeight * STORY_PANEL_ART_RATIO);
    const panelY = height - height * STORY_PANEL_BOTTOM_MARGIN_RATIO - panelH / 2;
    const panel = addStoryPanel(scene, {
      x: width / 2,
      y: panelY,
      width: width * STORY_PANEL_WIDTH_RATIO,
      height: panelH,
      text: pageText(index),
      depth: DEPTH + 2,
    });
    const layers = [image, ...panel.objects];
    const rise = options.rise ? panel.centerY - height / 2 : 0;
    const panelTop = panel.centerY - panel.height / 2;
    //* Spazio sopra il pannello nella posizione finale: se il personaggio non ci sta, si rimpicciolisce.
    const room = panelTop - rise - height * IMAGE_TOP_MARGIN;

    if (room > 0 && image.displayHeight > room) image.setScale((image.scale * room) / image.displayHeight);

    //* La base poggia sul bordo alto del pannello: sembra uscire da lì sotto.
    image.setY(panelTop);

    scene.tweens.add({targets: image, alpha: 1, duration: POPUP_OPEN_MS, ease: "Sine.easeOut"});

    if (options.rise) {
      scene.tweens.add({
        targets: layers,
        y: `-=${rise}`,
        duration: RISE_MS,
        delay: POPUP_OPEN_MS,
        ease: "Cubic.easeOut",
      });
    }

    await new Promise<void>((resolve) => {
      const onTap = () => {
        if (!panel.isComplete()) {
          panel.complete();

          return;
        }

        overlay.off("pointerup", onTap);
        resolve();
      };

      overlay.on("pointerup", onTap);
    });

    await this.#fade(layers, 0);
    panel.destroy();
    image.destroy();
  }

  //* Scritta a centro pagina sullo sfondo ancora scuro, poi sparisce da sola.
  async yourTurn(): Promise<void> {
    const {scene} = this;
    const {width, height} = scene.scale;
    const fontSize = Math.round(storyFontSize(width, height) * YOUR_TURN_SCALE);

    this.#showOverlay();

    const label = scene.add
      .text(width / 2, height / 2, t("yourTurn", getCurrentLanguage()), {
        align: "center",
        color: "#fff8dc",
        fontFamily: APP_FONT,
        fontSize: `${fontSize}px`,
        stroke: "#1a1208",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2)
      .setScale(0.6)
      .setAlpha(0);

    await this.#tween({targets: label, alpha: 1, scale: 1, duration: POPUP_OPEN_MS, ease: "Back.easeOut"});
    await new Promise<void>((resolve) => scene.time.delayedCall(YOUR_TURN_HOLD_MS, resolve));
    await this.#fade([label], 0);
    label.destroy();
  }

  async close(): Promise<void> {
    const overlay = this.#overlay;

    if (!overlay) return;

    this.#overlay = null;
    await this.#fade([overlay], 0);
    overlay.destroy();
  }

  //* Segna il tutorial come visto e libera le immagini.
  finish(): void {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");

    for (const key of imageKeys()) {
      if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    }
  }

  #showOverlay(): Phaser.GameObjects.Rectangle {
    if (this.#overlay) return this.#overlay;

    const {width, height} = this.scene.scale;

    this.#overlay = this.scene.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 1)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setAlpha(0)
      .setInteractive();
    void this.#fade([this.#overlay], OVERLAY_ALPHA);

    return this.#overlay;
  }

  #loadImages(extraKeys: string[] = []): Promise<void> {
    const missing = [...new Set([...imageKeys(), ...extraKeys])].filter(
      (key) => !this.scene.textures.exists(key),
    );

    if (!missing.length) return Promise.resolve();

    return new Promise((resolve) => {
      for (const key of missing) this.scene.load.image(key, `/images/tutorial/${key}.png`);

      this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      this.scene.load.start();
    });
  }

  #fade(targets: Phaser.GameObjects.GameObject[], alpha: number): Promise<void> {
    return this.#tween({targets, alpha, duration: POPUP_OPEN_MS, ease: "Sine.easeInOut"});
  }

  #tween(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({...config, onComplete: () => resolve()});
    });
  }
}
