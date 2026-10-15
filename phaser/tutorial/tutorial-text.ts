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
      it: "Striscia un elemento verso quello vicino, allineane 3 uguali e falli esplodere!",
      en: "Swipe an item toward the one next to it, line up 3 matching ones and make them explode!",
      es: "Desliza un elemento hacia el de al lado, alinea 3 iguales y hazlos explotar.",
      fr: "Fais glisser un élément vers son voisin, aligne-en 3 identiques et fais-les exploser !",
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
      it: "Ecco il Cuore Sacro! Si ottiene rompendo 5 oggetti disposti a forma di L o di T e fa esplodere gli oggetti più vicini nell'area circostante.",
      en: "Here is the Sacred Heart! You get it by breaking 5 items arranged in an L or T shape, and it explodes the nearest items in the surrounding area.",
      es: "¡Aquí está el Sagrado Corazón! Se obtiene rompiendo 5 objetos dispuestos en forma de L o de T y hace explotar los objetos más cercanos del área circundante.",
      fr: "Voici le Sacré-Cœur ! On l'obtient en brisant 5 objets disposés en L ou en T, et il fait exploser les objets les plus proches dans la zone autour de lui.",
    },
  },
  //* Sale a centro pagina mentre i super oggetti pulsano in basso.
  {
    image: "tutorial_2",
    text: {
      it: "Poi ci sono i super oggetti: Ostensorio, Stella di David, Falce dorata e Crocifisso! Ognuno ha effetti devastanti unici. Ottienili guardando diversi annunci, dal mercato o direttamente in partita. Provali tutti!",
      en: "Then there are the super items: Monstrance, Star of David, Golden Sickle and Crucifix! Each one has unique devastating effects. Get them by watching different ads, from the market or right in the match. Try them all!",
      es: "Además están los superobjetos: Ostensorio, Estrella de David, Hoz dorada y Crucifijo. Cada uno tiene efectos devastadores únicos. Consíguelos viendo distintos anuncios, en el mercado o directamente en la partida. ¡Pruébalos todos!",
      fr: "Puis il y a les super objets : Ostensoir, Étoile de David, Faucille dorée et Crucifix ! Chacun a des effets dévastateurs uniques. Obtiens-les en regardant différentes pubs, au marché ou directement en partie. Essaie-les tous !",
    },
  },
];
