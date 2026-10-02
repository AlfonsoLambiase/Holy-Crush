import * as Phaser from "phaser";

export const POPUP_OPEN_MS = 320;
export const POPUP_CLOSE_MS = 260;
const POPUP_SCALE_FROM = 0.76;

type AlphaTarget = Phaser.GameObjects.GameObject & {setAlpha: (value: number) => AlphaTarget};

export const animatePopupOpen = (
  scene: Phaser.Scene,
  popup: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject,
  targetScale: number,
  overlays: AlphaTarget | AlphaTarget[],
  overlayAlpha = 0.55,
) => {
  const list = Array.isArray(overlays) ? overlays : [overlays];

  popup.setScale(targetScale * POPUP_SCALE_FROM);

  for (const layer of list) layer.setAlpha(0);

  scene.tweens.add({
    targets: popup,
    scale: targetScale,
    duration: POPUP_OPEN_MS,
    ease: "Back.easeOut",
  });
  scene.tweens.add({
    targets: list,
    alpha: overlayAlpha,
    duration: POPUP_OPEN_MS,
    ease: "Sine.easeOut",
  });
};

export const animatePopupClose = (
  scene: Phaser.Scene,
  popup: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject,
  targetScale: number,
  overlays: AlphaTarget | AlphaTarget[],
  onDone: () => void,
) => {
  const list = Array.isArray(overlays) ? overlays : [overlays];
  const endScale = targetScale * POPUP_SCALE_FROM;
  let done = false;

  const finish = () => {
    if (done) return;

    done = true;
    onDone();
  };

  scene.tweens.add({
    targets: popup,
    scale: endScale,
    duration: POPUP_CLOSE_MS,
    ease: "Sine.easeIn",
  });
  scene.tweens.add({
    targets: list.filter((layer) => layer.active),
    alpha: 0,
    duration: POPUP_CLOSE_MS,
    ease: "Sine.easeIn",
    onComplete: finish,
  });
  scene.time.delayedCall(POPUP_CLOSE_MS + 40, finish);
};
