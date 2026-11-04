import {listAllGrids} from "@game/shared/config/grid-generation.const";
import {
  probeLevelSolvable,
  progressionForGridId,
  staticLevelIssues,
} from "@game/shared/level-simulator";

const grids = listAllGrids();
const staticBad: {id: string; issues: string[]}[] = [];
const simBad: string[] = [];

for (const shape of grids) {
  const progression = progressionForGridId(shape.stageIndex, shape.localLevel);
  const staticIssues = staticLevelIssues(shape, progression);

  if (staticIssues.length) {
    staticBad.push({id: shape.id, issues: staticIssues});

    continue;
  }

  if (!probeLevelSolvable(shape, progression, 72)) {
    simBad.push(shape.id);
  }
}

console.log(`Griglie totali: ${grids.length}`);
console.log(`Errori statici: ${staticBad.length}`);

for (const entry of staticBad) {
  console.log(`  ${entry.id}: ${entry.issues.join(", ")}`);
}

console.log(`Non risolte in simulazione (72 seed): ${simBad.length}`);

for (const id of simBad) {
  console.log(`  ${id}`);
}

process.exit(staticBad.length || simBad.length ? 1 : 0);
