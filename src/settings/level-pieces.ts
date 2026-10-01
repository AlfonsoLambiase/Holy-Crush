/** Gruppi tematici obj (cartella stage_obj: obj_{gruppo}_{variante}). */
export const OBJ_GROUP_COUNT = 8;
export const OBJ_VARIANT_COUNT = 4;
/** Livelli 1–7: un gruppo fisso per livello (liv1 → gruppo_0 … liv7 → gruppo_6). */
export const FIXED_GROUP_LEVELS = 7;

export const objTextureKey = (group: number, variant: number): string =>
  `obj_${group}_${variant}`;

export const allObjTextureKeys = (): string[] => {
  const keys: string[] = [];

  for (let g = 0; g < OBJ_GROUP_COUNT; g++) {
    for (let v = 0; v < OBJ_VARIANT_COUNT; v++) {
      keys.push(objTextureKey(g, v));
    }
  }

  return keys;
};

const GROUPS = Array.from({length: OBJ_GROUP_COUNT}, (_, i) => i);
const VARIANTS = Array.from({length: OBJ_VARIANT_COUNT}, (_, i) => i);

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const arr = [...items];
  let s = seed >>> 0;

  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function pickRandomPieceKeys(stageIndex: number, localLevel: number): string[] {
  const groupSeed = stageIndex * 1_009 + localLevel * 97;
  const variantSeed = stageIndex * 503 + localLevel * 211;
  const chosenGroups = seededShuffle(GROUPS, groupSeed).slice(0, OBJ_VARIANT_COUNT);
  const chosenVariants = seededShuffle(VARIANTS, variantSeed);

  return chosenGroups.map((group, i) => objTextureKey(group, chosenVariants[i]));
}

/** Quattro texture match-3 per livello locale nello stage (1–20); ripete lo schema su ogni stage. */
export function getPieceKeysForStageLevel(localLevel: number, stageIndex: number): readonly string[] {
  const level = Math.max(1, Math.floor(localLevel));
  const stage = Math.max(0, Math.floor(stageIndex));

  if (level <= FIXED_GROUP_LEVELS) {
    const group = level - 1;

    return VARIANTS.map((v) => objTextureKey(group, v));
  }

  return pickRandomPieceKeys(stage, level);
}
