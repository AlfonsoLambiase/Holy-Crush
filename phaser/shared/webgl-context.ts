import * as Phaser from "phaser";

/**
 * Android resetta la GPU sotto pressione e il frame dopo legge glTexture null,
 * poi chiude la WebView. preventDefault tiene il contesto recuperabile;
 * il loop si ferma finché il browser non lo ridà.
 */
export const bindWebGLContextGuard = (game: Phaser.Game): (() => void) => {
  const canvas = game.canvas;

  if (!canvas) return () => {};

  const onLost = (event: Event) => {
    event.preventDefault();
    game.pause();
    game.loop.sleep();
  };

  const onRestored = () => {
    game.resume();
    game.loop.wake(true);
  };

  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return () => {
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
  };
};
