import {getModeConfig} from "./game-mode";

/** Gruppi tematici obj (cartella stage_obj: obj_{gruppo}_{variante}); quanti gruppi dipende dalla modalità. */
export const getObjGroupCount = (): number => getModeConfig().objGroups;
export const OBJ_VARIANT_COUNT = 4;
/** Primi livelli: un gruppo fisso per livello (liv1 → gruppo_0 …), al massimo 7. */
const MAX_FIXED_GROUP_LEVELS = 7;

export const objTextureKey = (group: number, variant: number): string =>
  `obj_${group}_${variant}`;

const range = (length: number): number[] => Array.from({length}, (_, i) => i);

const VARIANTS = range(OBJ_VARIANT_COUNT);

export const allObjTextureKeys = (): string[] =>
  range(getObjGroupCount()).flatMap((g) => VARIANTS.map((v) => objTextureKey(g, v)));

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

//* Con meno gruppi delle varianti servono comunque 4 pezzi diversi: si pesca tra tutte le texture
function pickRandomPieceKeys(stageIndex: number, localLevel: number): string[] {
  const groupSeed = stageIndex * 1_009 + localLevel * 97;
  const variantSeed = stageIndex * 503 + localLevel * 211;
  const groups = range(getObjGroupCount());

  if (groups.length < OBJ_VARIANT_COUNT) {
    return seededShuffle(allObjTextureKeys(), groupSeed).slice(0, OBJ_VARIANT_COUNT);
  }

  const chosenGroups = seededShuffle(groups, groupSeed).slice(0, OBJ_VARIANT_COUNT);
  const chosenVariants = seededShuffle(VARIANTS, variantSeed);

  return chosenGroups.map((group, i) => objTextureKey(group, chosenVariants[i]));
}

/** Quattro texture match-3 per livello locale nello stage; ripete lo schema su ogni stage. */
export function getPieceKeysForStageLevel(localLevel: number, stageIndex: number): readonly string[] {
  const level = Math.max(1, Math.floor(localLevel));
  const stage = Math.max(0, Math.floor(stageIndex));

  if (level <= Math.min(MAX_FIXED_GROUP_LEVELS, getObjGroupCount())) {
    const group = level - 1;

    return VARIANTS.map((v) => objTextureKey(group, v));
  }

  return pickRandomPieceKeys(stage, level);
}
