import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "phaser/grid");

const OBSTACLE = {
  ice: ["I", "J"],
  chain: ["L"],
  crate: ["B", "C", "D"],
  terrain: ["G", "H"],
  rock: ["R"],
  thorn: ["V"],
};

const ADD_SYMBOL = {
  crate: "B",
  terrain: "G",
  thorn: "V",
  chain: "L",
  rock: "R",
  ice: "I",
};

const COMMENT_HINT = {
  crate: "casse B",
  terrain: "terreno G",
  thorn: "rovi V",
  chain: "catene L",
  rock: "rocce R",
  ice: "ghiaccio I",
};

const presentKinds = (rows) => {
  const flat = rows.join("");
  const kinds = new Set();

  if (flat.includes("0")) kinds.add("collect");

  for (const kind of Object.keys(OBSTACLE)) {
    if (OBSTACLE[kind].some((symbol) => flat.includes(symbol))) kinds.add(kind);
  }

  return kinds;
};

const parseGridFile = (content) => {
  const id = content.match(/export const (GRID_\d+)/)?.[1];
  const rows = [...content.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  return {id, rows, comment: content.split("\n")[0] ?? ""};
};

const replaceFirstZero = (rows) => {
  for (let r = 0; r < rows.length; r++) {
    const index = rows[r].indexOf("0");

    if (index >= 0) {
      rows[r] = rows[r].slice(0, index) + "PLACEHOLDER" + rows[r].slice(index + 1);

      return true;
    }
  }

  return false;
};

const ensureCollect = (rows) => {
  if (rows.join("").includes("0")) return;

  for (let r = 0; r < rows.length; r++) {
    const index = rows[r].indexOf(".");

    if (index >= 0) {
      rows[r] = rows[r].slice(0, index) + "0" + rows[r].slice(index + 1);

      return;
    }
  }
};

const enrichRows = (rows, targetKinds) => {
  const working = rows.map((row) => row);
  const kinds = presentKinds(working);
  const addOrder = ["crate", "terrain", "thorn", "chain", "rock", "ice"];

  ensureCollect(working);

  for (const kind of addOrder) {
    if (kinds.size >= targetKinds) break;
    if (kinds.has(kind)) continue;

    const symbol = ADD_SYMBOL[kind];

    if (!replaceFirstZero(working)) break;

    for (let r = 0; r < working.length; r++) {
      working[r] = working[r].replace("PLACEHOLDER", symbol);
    }

    kinds.add(kind);
  }

  if (!kinds.has("collect") && presentKinds(working).size < targetKinds) {
    ensureCollect(working);
    kinds.add("collect");
  }

  return working;
};

const patchComment = (comment, rows) => {
  let next = comment;
  const flat = rows.join("");

  for (const kind of Object.keys(ADD_SYMBOL)) {
    const symbol = ADD_SYMBOL[kind];
    const hint = COMMENT_HINT[kind];

    if (!flat.includes(symbol)) continue;
    if (next.includes(hint) || next.includes(` ${symbol}`)) continue;

    next = next.replace(/\.\s*$/, `, ${hint}.`);
  }

  return next;
};

const writeGrid = (filePath, id, comment, rows) => {
  const indent = "  ";
  const body = rows.map((row) => `${indent}"${row}",`).join("\n");
  const content = `${comment}\nexport const ${id} = [\n${body}\n] as const;\n`;

  fs.writeFileSync(filePath, content);
};

const stageDirs = fs
  .readdirSync(root, {withFileTypes: true})
  .filter((entry) => entry.isDirectory() && /^stage-\d+$/.test(entry.name))
  .map((entry) => entry.name)
  .filter((name) => Number(name.slice(6)) >= 4)
  .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));

const changed = [];

for (const stageDir of stageDirs) {
  const dir = path.join(root, stageDir);
  const files = fs
    .readdirSync(dir)
    .filter((name) => /^grid-\d+\.ts$/.test(name))
    .sort();

  for (const name of files) {
    const filePath = path.join(dir, name);
    const original = fs.readFileSync(filePath, "utf8");
    const {id, rows, comment} = parseGridFile(original);
    const before = presentKinds(rows).size;

    if (before >= 4) continue;

    const enriched = enrichRows(rows, 4);
    const after = presentKinds(enriched).size;

    if (after < before || enriched.join("|") === rows.join("|")) continue;

    const newComment = patchComment(comment, enriched);

    writeGrid(filePath, id, newComment, enriched);
    changed.push(`${stageDir}/${name} (${before}→${after})`);
  }
}

console.log(`Enriched ${changed.length} grids`);
changed.forEach((line) => console.log(line));
