import type {Language} from "@/language";

export type TutorialPage = {
  image: string;
  text: Record<Language, string>;
};

//* Pagine del primo livello del primo stage, in ordine. Se una lingua è vuota si usa l'italiano.
export const TUTORIAL_PAGES: TutorialPage[] = [
  //* Prima dello swipe guidato che crea l'Ira Celeste.
  {
    image: "tutorial_0",
    text: {
      it: "Striscia un elemento verso quello vicino, allineane 3 uguali e falli scoppiare!",
      en: "Swipe an item toward the one next to it, line up 3 matching ones and make them pop!",
      es: "Desliza un elemento hacia el de al lado, alinea 3 iguales y hazlos estallar.",
      fr: "Fais glisser un élément vers son voisin, aligne-en 3 identiques et fais-les éclater !",
    },
  },
  //* L'Ira Celeste è appena nata e pulsa.
  {
    image: "tutorial_1",
    text: {
      it: "Hai creato l'Ira Celeste! Nasce rompendo 4 oggetti in linea e spazza via un'intera riga.",
      en: "You created the Heavenly Wrath! It is born by breaking 4 items in a line and sweeps away a whole row.",
      es: "¡Has creado la Ira Celestial! Nace al romper 4 objetos en línea y barre una fila entera.",
      fr: "Tu as créé la Colère Céleste ! Elle naît en brisant 4 objets en ligne et balaie toute une rangée.",
    },
  },
  //* Il Cuore Sacro è appena nato e pulsa.
  {
    image: "tutorial_1",
    text: {
      it: "Ecco il Cuore Sacro! Si ottiene rompendo 5 oggetti disposti a forma angolare e fa scoppiare gli oggetti più vicini nell'area circostante.",
      en: "Here is the Sacred Heart! You get it by breaking 5 items arranged in an angular shape, and it pops the nearest items in the surrounding area.",
      es: "¡Aquí está el Sagrado Corazón! Se obtiene rompiendo 5 objetos dispuestos en forma angular y hace estallar los objetos más cercanos del área circundante.",
      fr: "Voici le Sacré-Cœur ! On l'obtient en brisant 5 objets disposés en forme angulaire, et il fait éclater les objets les plus proches dans la zone autour de lui.",
    },
  },
  //* Sale a centro pagina mentre i super oggetti pulsano in basso.
  {
    image: "tutorial_2",
    text: {
      it: "Poi ci sono i super oggetti! Ognuno di loro ha effetti devastanti. Ottienili guardando gli annunci dal mercato o in partita e provali tutti!",
      en: "Then there are the super items! Each one has devastating effects. Get them by watching ads from the market or in the match and try them all!",
      es: "¡Luego están los superobjetos! Cada uno de ellos tiene efectos devastadores. Consíguelos viendo los anuncios en el mercado o en la partida y pruébalos todos!",
      fr: "Puis il y a les super objets ! Chacun d'eux a des effets dévastateurs. Obtiens-les en regardant les annonces au marché ou en partie et essaie-les tous !",
    },
  },
];
