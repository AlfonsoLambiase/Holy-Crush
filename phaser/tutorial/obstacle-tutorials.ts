import type {Language} from "@/language";

import type {GridSymbol} from "../grid/create-grid";
import type {MissionGoal} from "../shared/level-mission";

export type ObstacleTipId =
  | "collect"
  | "terrain"
  | "terrain_h"
  | "ice"
  | "ice_j"
  | "crate"
  | "chain"
  | "thorn"
  | "rock"
  | "wall"
  | "goals_two"
  | "goals_three"
  | "goals_four";

export type ObstacleTip = {
  id: ObstacleTipId;
  order: number;
  image: "tutorial_0";
  text: Record<Language, string>;
  present?: (cells: GridSymbol[][]) => boolean;
  mission?: (ctx: {goals: MissionGoal[]; stageIndex: number}) => boolean;
};

const flat = (cells: GridSymbol[][]): string => cells.flat().join("");

const hasAny = (cells: GridSymbol[][], symbols: string): boolean => {
  const board = flat(cells);

  return [...symbols].some((symbol) => board.includes(symbol));
};

/** Prima volta che incontri ostacoli/obiettivi: ordine di visualizzazione. */
export const OBSTACLE_TIPS: ObstacleTip[] = [
  {
    id: "collect",
    order: 10,
    image: "tutorial_0",
    text: {
      it: "Fai scoppiare il numero richiesto di oggetti con meno mosse possibili, sfruttando le combinazioni più efficaci.",
      en: "Pop the required number of objects in as few moves as possible, using the most effective combinations.",
      es: "Haz estallar la cantidad de objetos que pide el objetivo con el menor número de movimientos, aprovechando las combinaciones más eficaces.",
      fr: "Fais éclater le nombre d'objets demandé en un minimum de coups, en visant les combos les plus efficaces.",
    },
    present: (cells) => hasAny(cells, "0"),
  },
  {
    id: "terrain",
    order: 20,
    image: "tutorial_0",
    text: {
      it: "Questa è la zona avvelenata: fai scoppiare gli oggetti sovrastanti per bonificarla.",
      en: "This is the poisoned zone: pop the objects above it to cleanse it.",
      es: "Esta es la zona envenenada: haz estallar los objetos de encima para purificarla.",
      fr: "Voici la zone empoisonnée : fais éclater les objets au-dessus pour la purifier.",
    },
    present: (cells) => hasAny(cells, "G"),
  },
  {
    id: "terrain_h",
    order: 25,
    image: "tutorial_0",
    text: {
      it: "La Zona magma ha bisogno di essere prima raffreddata e poi bonificata, esegui con due scoppi sopra la stessa casella!",
      en: "The magma zone must be cooled first, then cleansed — pop twice above the same cell!",
      es: "La zona de magma hay que enfriarla primero y luego purificarla: ¡dos estallidos encima de la misma casilla!",
      fr: "La zone magma doit d'abord être refroidie puis purifiée : deux éclatements au-dessus de la même case !",
    },
    present: (cells) => hasAny(cells, "H"),
  },
  {
    id: "ice",
    order: 30,
    image: "tutorial_0",
    text: {
      it: "Il ghiaccio sta bloccando l'oggetto. Utilizza le combinazioni sopra o vicine per scioglierlo.",
      en: "Ice is blocking the piece. Use combinations above or nearby to melt it.",
      es: "El hielo está bloqueando el objeto. Usa combinaciones encima o cerca para derretirlo.",
      fr: "La glace bloque l'objet. Utilise des combos au-dessus ou à côté pour la faire fondre.",
    },
    present: (cells) => hasAny(cells, "I"),
  },
  {
    id: "ice_j",
    order: 35,
    image: "tutorial_0",
    text: {
      it: "Il ghiaccio incatenato rende la sfida più difficile! Rompi prima la catena, poi sciogli il ghiaccio per liberare il pezzo.",
      en: "Chained ice makes things harder! Break the chain first, then melt the ice to free the piece.",
      es: "¡El hielo encadenado complica la partida! Rompe la cadena primero y luego derrite el hielo para liberar la pieza.",
      fr: "La glace enchaînée complique la partie ! Casse la chaîne d'abord, puis fais fondre la glace pour libérer la pièce.",
    },
    present: (cells) => hasAny(cells, "J"),
  },
  {
    id: "crate",
    order: 40,
    image: "tutorial_0",
    text: {
      it: "I forzieri occupano la casella e bloccano lo spostamento degli oggetti. Ne esistono vari tipi, quelli blindati reggono più colpi!",
      en: "Chests occupy the cell and block pieces from moving. There are several types; armored ones take more hits!",
      es: "Los cofres ocupan la casilla y bloquean el movimiento de los objetos. Hay varios tipos; ¡los blindados aguantan más golpes!",
      fr: "Les coffres occupent la case et empêchent les objets de bouger. Il y en a plusieurs types ; les blindés encaissent plus de coups !",
    },
    present: (cells) => hasAny(cells, "BCD"),
  },
  {
    id: "chain",
    order: 50,
    image: "tutorial_0",
    text: {
      it: "La catena blocca l'oggetto. Liberarlo con una combinazione, o con un super oggetto!",
      en: "The chain locks the piece. Free it with a combination, or with a super item!",
      es: "La cadena bloquea el objeto. ¡Libéralo con una combinación o con un superobjeto!",
      fr: "La chaîne bloque l'objet. Libère-le avec un combo, ou avec un super objet !",
    },
    present: (cells) => hasAny(cells, "L"),
  },
  {
    id: "thorn",
    order: 60,
    image: "tutorial_0",
    text: {
      it: "Il rovo di spine si espande se non lo distruggi durante la mossa: colpiscilo spesso con scoppi vicini, così lo terrai sotto controllo!",
      en: "The thorn bush spreads if you don't destroy it during your move: hit it often with nearby pops so you keep it under control!",
      es: "La zarza se expande si no la destruyes en tu turno: golpéala a menudo con estallidos cerca para mantenerla bajo control.",
      fr: "Le buisson d'épines s'étend si tu ne le détruis pas pendant ton coup : frappe-le souvent avec des éclatements voisins pour le garder sous contrôle !",
    },
    present: (cells) => hasAny(cells, "V"),
  },
  {
    id: "rock",
    order: 70,
    image: "tutorial_0",
    text: {
      it: "La roccia è dura ma cede ai super oggetti. Usali con saggezza!",
      en: "Rock is tough but yields to super items. Use them wisely!",
      es: "La roca es dura, pero cede ante los superobjetos. ¡Úsalos con cabeza!",
      fr: "La roche est dure, mais cède aux super objets. Utilise-les avec malice !",
    },
    present: (cells) => hasAny(cells, "R"),
  },
  {
    id: "wall",
    order: 80,
    image: "tutorial_0",
    text: {
      it: "Il muro è permanente e non si abbatte in alcun modo. Giocaci intorno e non farti bloccare la strada!",
      en: "Walls are permanent and can't be knocked down. Play around them and don't let them block your path!",
      es: "El muro es permanente y no se derriba de ningún modo. Juega alrededor y no dejes que te bloquee el camino.",
      fr: "Le mur est permanent et ne s'abat pas. Joue autour et ne te laisse pas bloquer le passage !",
    },
    present: (cells) => hasAny(cells, "X"),
  },
  {
    id: "goals_two",
    order: 90,
    image: "tutorial_0",
    text: {
      it: "Qui hai due obiettivi insieme: devi completarli tutti e due prima di vincere. Tienili d'occhio!",
      en: "You have two goals at once: complete both before you win. Keep an eye on them!",
      es: "Aquí tienes dos objetivos a la vez: complétalos los dos antes de ganar. ¡No pierdas de vista el contador!",
      fr: "Tu as deux objectifs à la fois : remplis-les tous les deux avant de gagner. Garde-les en tête !",
    },
    mission: ({goals}) => goals.length >= 2,
  },
  {
    id: "goals_three",
    order: 100,
    image: "tutorial_0",
    text: {
      it: "Tre obiettivi questa volta. Sono certo che ce la farai!",
      en: "Three goals this time. I'm sure you can do it!",
      es: "Tres objetivos esta vez. ¡Seguro que lo logras!",
      fr: "Trois objectifs cette fois. Je suis sûr que tu vas y arriver !",
    },
    mission: ({goals}) => goals.length >= 3,
  },
  {
    id: "goals_four",
    order: 110,
    image: "tutorial_0",
    text: {
      it: "Quattro obiettivi, partita tosta! Completa tutto prima che finiscano le mosse. Ho fede in te!",
      en: "Four goals — tough match! Complete everything before you run out of moves. I believe in you!",
      es: "Cuatro objetivos, ¡partida dura! Complétalo todo antes de quedarte sin movimientos. Confío en ti.",
      fr: "Quatre objectifs, partie corsée ! Tout finir avant de manquer de coups. J'ai confiance en toi !",
    },
    mission: ({goals}) => goals.length >= 4,
  },
];

export const pendingObstacleTips = (
  cells: GridSymbol[][],
  goals: MissionGoal[],
  stageIndex: number,
): ObstacleTip[] =>
  OBSTACLE_TIPS.filter((tip) => {
    if (tip.present && !tip.present(cells)) return false;
    if (tip.mission && !tip.mission({goals, stageIndex})) return false;
    if (!tip.present && !tip.mission) return false;

    return true;
  }).sort((a, b) => a.order - b.order);
