import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = path.join(root, "public", "ui_home", "logo_app.png");
const assetsDir = path.join(root, "assets");
const publicIconsDir = path.join(root, "public", "icons");
const appDir = path.join(root, "src", "app");

/** Celeste simile allo sfondo del logo */
const ICON_BG = {r: 159, g: 212, b: 245, alpha: 1};
const MASTER = 1024;
const INSET = 0.07;

async function buildSquareIconBuffer(size) {
  const inner = Math.round(size * (1 - INSET * 2));
  const logo = await sharp(logoPath)
    .resize({width: inner, height: inner, fit: "inside", withoutEnlargement: false})
    .png()
    .toBuffer();

  return sharp({
    create: {width: size, height: size, channels: 4, background: ICON_BG},
  })
    .composite([{input: logo, gravity: "center"}])
    .png()
    .toBuffer();
}

async function main() {
  await fs.mkdir(assetsDir, {recursive: true});
  await fs.mkdir(publicIconsDir, {recursive: true});

  const masterBuf = await buildSquareIconBuffer(MASTER);
  await fs.writeFile(path.join(assetsDir, "icon.png"), masterBuf);
  await sharp(masterBuf).resize(512).toFile(path.join(appDir, "icon.png"));
  await sharp(masterBuf).resize(180).toFile(path.join(appDir, "apple-icon.png"));
  await sharp(masterBuf).resize(192).toFile(path.join(publicIconsDir, "icon-192.png"));
  await sharp(masterBuf).resize(512).toFile(path.join(publicIconsDir, "icon-512.png"));

  console.log("Icone generate da public/ui_home/logo_app.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
