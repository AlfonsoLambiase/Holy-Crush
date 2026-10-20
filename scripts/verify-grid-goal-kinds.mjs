import fs from "fs";
import path from "path";

const OB = {
  ice: ["I", "J"],
  chain: ["L"],
  crate: ["B", "C", "D"],
  terrain: ["G", "H"],
  rock: ["R"],
  thorn: ["V"],
};

const kindCount = (rows) => {
  const flat = rows.join("");
  let count = 0;

  if (flat.includes("0")) count++;

  for (const symbols of Object.values(OB)) {
    if (symbols.some((symbol) => flat.includes(symbol))) count++;
  }

  return count;
};

const root = path.join(process.cwd(), "phaser/grid");
const bad = [];

for (let stage = 4; stage <= 20; stage++) {
  const dir = path.join(root, `stage-${String(stage).padStart(2, "0")}`);

  if (!fs.existsSync(dir)) continue;

  for (const file of fs.readdirSync(dir).filter((name) => name.startsWith("grid-"))) {
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    const rows = [...text.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    const count = kindCount(rows);

    if (count < 4) bad.push(`${dir}/${file} → ${count}`);
  }
}

console.log(`Under 4 kinds: ${bad.length}`);
bad.forEach((line) => console.log(line));
