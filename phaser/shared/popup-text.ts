import * as Phaser from "phaser";

const GOLD = "#ffd76a";
const BROWN = "#5c3a14";
const BROWN_LIGHT = "#a07a55b8";

const strokeFor = (fontSize: number, ratio: number) => Math.max(3, Math.round(fontSize * ratio));

//* Titolo oro, bordo marrone come il body.
export const stylePopupTitle = (text: Phaser.GameObjects.Text, fontSize: number): void => {
  text.setColor(GOLD);
  text.setFontStyle("bold");
  text.setStroke(BROWN, strokeFor(fontSize, 0.11));
  text.setShadow(0, 0, "#ffecaa", 8, false, true);
};

//* Body marrone, bordo un filo più chiaro.
export const stylePopupBody = (text: Phaser.GameObjects.Text, fontSize: number): void => {
  text.setColor(BROWN);
  text.setFontStyle("bold");
  text.setStroke(BROWN_LIGHT, Math.max(2, Math.round(fontSize * 0.055)));
};
