import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "phaser/grid");
const fix = process.argv.includes("--fix");

const parseRows = (text) => [...text.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const playableCount = (rows) =>
  rows.reduce((sum, row) => sum + [...row].filter((c) => c !== ".").length, 0);

const rowFills = (rows) => rows.map((row) => [...row].filter((c) => c !== ".").length);

/** Croce / bracci stretti: forte variazione di larghezza giocabile per riga. */
const isCrossShape = (rows) => {
  const fills = rowFills(rows).filter((n) => n > 0);

  if (fills.length < 3) return false;

  const max = Math.max(...fills);
  const min = Math.min(...fills);

  if (max - min < 2) return false;

  const narrow = fills.filter((n) => n <= min + 1).length;
  const wide = fills.filter((n) => n >= max - 1).length;

  return narrow >= 2 && wide >= 1;
};

const isLargeGrid = (rows) => {
  const rowsN = rows.length;
  const colsN = rows[0]?.length ?? 0;

  return rowsN * colsN >= 48 || playableCount(rows) >= 40 || (rowsN >= 9 && colsN >= 6);
};

const columnXCounts = (rows) => {
  const cols = rows[0].length;
  const counts = Array(cols).fill(0);

  for (const row of rows) {
    for (let c = 0; c < cols; c++) {
      if (row[c] === "X") counts[c]++;
    }
  }

  return counts;
};

const maxColumnX = (rows) => Math.max(0, ...columnXCounts(rows));

const fixRows = (rows) => {
  const cols = rows[0].length;
  const cross = isCrossShape(rows);
  const large = isLargeGrid(rows);
  const noWalls = cross;
  const keptPerCol = Array(cols).fill(0);
  const out = rows.map((row) => [...row]);

  for (let r = 0; r < out.length; r++) {
    for (let c = 0; c < cols; c++) {
      if (out[r][c] !== "X") continue;

      if (noWalls) {
        out[r][c] = "0";
        continue;
      }

      if (keptPerCol[c] < 2) {
        keptPerCol[c]++;
        continue;
      }

      out[r][c] = "0";
    }
  }

  return out.map((row) => row.join(""));
};

const cleanHeader = (headerLine, rows) => {
  const hasX = rows.some((row) => row.includes("X"));

  if (hasX) return headerLine;

  return headerLine
    .replace(/,?\s*muri X/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*,/g, ",")
    .replace(/\.\s+\*\//, ". */");
};

const updateFile = (filePath, newRows, headerLine) => {
  const id = path.basename(filePath, ".ts").replace("grid-", "GRID_");
  const header = cleanHeader(headerLine, newRows);
  const body = [
    header,
    `export const ${id} = [`,
    ...newRows.map((row) => `  "${row}",`),
    "] as const;",
    "",
  ].join("\n");

  fs.writeFileSync(filePath, body, "utf8");
};

const issues = [];
let fixed = 0;

for (let stage = 1; stage <= 20; stage++) {
  const dir = path.join(root, `stage-${String(stage).padStart(2, "0")}`);

  if (!fs.existsSync(dir)) continue;

  for (const file of fs.readdirSync(dir).filter((name) => name.startsWith("grid-"))) {
    const filePath = path.join(dir, file);
    const text = fs.readFileSync(filePath, "utf8");
    const headerLine = text.split("\n")[0];
    const rows = parseRows(text);
    const xCount = rows.join("").split("X").length - 1;

    if (xCount === 0) continue;

    const cross = isCrossShape(rows);
    const large = isLargeGrid(rows);
    const maxCol = maxColumnX(rows);
    const badCross = cross && xCount > 0;
    const badCol = maxCol > 2;

    if (!badCross && !badCol) continue;

    const rel = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
    issues.push({
      rel,
      filePath,
      headerLine,
      rows,
      cross,
      large,
      maxCol,
      xCount,
    });

    if (fix) {
      const newRows = fixRows(rows);
      updateFile(filePath, newRows, headerLine);
      fixed++;
    }
  }
}

console.log(`Griglie con muri da correggere: ${issues.length}`);

for (const item of issues) {
  const flags = [
    item.cross ? "croce" : null,
    item.large ? "grande" : null,
    item.maxCol > 2 ? `col max ${item.maxCol}X` : null,
  ]
    .filter(Boolean)
    .join(", ");

  console.log(`  ${item.rel} (${item.xCount} X) → ${flags}`);
}

if (fix) {
  console.log(`\nFix applicati: ${fixed} file.`);

  let headers = 0;

  for (let stage = 1; stage <= 20; stage++) {
    const dir = path.join(root, `stage-${String(stage).padStart(2, "0")}`);

    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir).filter((name) => name.startsWith("grid-"))) {
      const filePath = path.join(dir, file);
      const text = fs.readFileSync(filePath, "utf8");
      const headerLine = text.split("\n")[0];
      const rows = parseRows(text);

      if (rows.join("").includes("X")) continue;

      const header = cleanHeader(headerLine, rows);

      if (header === headerLine) continue;

      updateFile(filePath, rows, headerLine);
      headers++;
    }
  }

  if (headers) console.log(`Commenti aggiornati (senza muri): ${headers} file.`);
} else {
  console.log("\nEsegui con --fix per sostituire X con 0 dove serve.");
}

/** Passaggio finale: ogni griglia con X deve rispettare le regole. */
const leftovers = [];

for (let stage = 1; stage <= 20; stage++) {
  const dir = path.join(root, `stage-${String(stage).padStart(2, "0")}`);

  if (!fs.existsSync(dir)) continue;

  for (const file of fs.readdirSync(dir).filter((name) => name.startsWith("grid-"))) {
    const rows = parseRows(fs.readFileSync(path.join(dir, file), "utf8"));
    const xCount = rows.join("").split("X").length - 1;

    if (xCount === 0) continue;

    const cross = isCrossShape(rows);
    const maxCol = maxColumnX(rows);

    if (cross || maxCol > 2) {
      leftovers.push(`${path.join(dir, file)} cross=${cross} maxCol=${maxCol}`);
    }
  }
}

if (leftovers.length) {
  console.error(`\nValidazione fallita (${leftovers.length}):`);
  leftovers.forEach((line) => console.error(`  ${line}`));
  process.exit(1);
}

if (issues.length > 0 && !fix) process.exit(1);
