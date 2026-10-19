/** React HUD (es. mappa mondi) sopra il canvas Phaser: blocca sfx/azioni del btnRead sotto. */
let depth = 0;

export const pushReactHudOverlay = (): void => {
  depth += 1;
};

export const popReactHudOverlay = (): void => {
  depth = Math.max(0, depth - 1);
};

export const isReactHudOverlayActive = (): boolean => depth > 0;
