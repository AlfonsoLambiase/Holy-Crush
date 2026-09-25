type OpeningLanguage = "it" | "en" | "es" | "fr";

export type OpeningText = {
  key: string;
} & Record<OpeningLanguage, string>;

//* Un testo per ogni op_N: la chiave è opening_<indice del file>
export const OPENING_TEXTS: OpeningText[] = [
  {
    key: "opening_0",
    it: "L'angelo Gabriele porta a Maria un giglio e un annuncio: concepirà un figlio e lo chiamerà Gesù.",
    en: "The angel Gabriel brings Mary a lily and a message: she will conceive a son and name him Jesus.",
    es: "El ángel Gabriel trae a María un lirio y un anuncio: concebirá un hijo y lo llamará Jesús.",
    fr: "L'ange Gabriel apporte à Marie un lis et une annonce : elle concevra un fils et l'appellera Jésus.",
  },
  {
    key: "opening_1",
    it: "Maria e Giuseppe partono di notte verso Betlemme. Il bambino che portano è la promessa che cammina con loro.",
    en: "Mary and Joseph set out at night for Bethlehem. The child they carry is the promise walking with them.",
    es: "María y José salen de noche hacia Belén. El niño que llevan es la promesa que camina con ellos.",
    fr: "Marie et Joseph partent de nuit vers Bethléem. L'enfant qu'ils portent est la promesse qui marche avec eux.",
  },
  {
    key: "opening_2",
    it: "A Betlemme, in una mangiatoia, nasce Gesù. La stella chiama pastori e magi a inchinarsi davanti a lui.",
    en: "In Bethlehem, in a manger, Jesus is born. The star calls shepherds and magi to kneel before him.",
    es: "En Belén, en un pesebre, nace Jesús. La estrella llama a pastores y magos a arrodillarse ante él.",
    fr: "À Bethléem, dans une crèche, Jésus naît. L'étoile appelle bergers et mages à s'incliner devant lui.",
  },
  {
    key: "opening_3",
    it: "Un avvertimento in sogno: Giuseppe prende Maria e il bambino e fugge verso l'Egitto, sotto la luna.",
    en: "A warning in a dream: Joseph takes Mary and the child and flees to Egypt, under the moon.",
    es: "Un aviso en sueños: José toma a María y al niño y huye a Egipto, bajo la luna.",
    fr: "Un avertissement en songe : Joseph prend Marie et l'enfant et fuit vers l'Égypte, sous la lune.",
  },
  {
    key: "opening_4",
    it: "I magi seguono la stella fino alla casa. Aprono i loro doni e riconoscono il re che è venuto.",
    en: "The magi follow the star to the house. They open their gifts and recognize the king who has come.",
    es: "Los magos siguen la estrella hasta la casa. Abren sus regalos y reconocen al rey que ha venido.",
    fr: "Les mages suivent l'étoile jusqu'à la maison. Ils ouvrent leurs cadeaux et reconnaissent le roi venu.",
  },
  {
    key: "opening_5",
    it: "Al tempio, Simeone prende il bambino tra le braccia: i suoi occhi hanno visto la salvezza.",
    en: "At the temple, Simeon takes the child in his arms: his eyes have seen salvation.",
    es: "En el templo, Simeón toma al niño en brazos: sus ojos han visto la salvación.",
    fr: "Au temple, Siméon prend l'enfant dans ses bras : ses yeux ont vu le salut.",
  },
  {
    key: "opening_6",
    it: "Nel Giordano, Gesù scende nell'acqua. Il cielo si apre e una voce lo chiama Figlio amato.",
    en: "In the Jordan, Jesus steps into the water. Heaven opens and a voice calls him the beloved Son.",
    es: "En el Jordán, Jesús baja al agua. El cielo se abre y una voz lo llama Hijo amado.",
    fr: "Dans le Jourdain, Jésus entre dans l'eau. Le ciel s'ouvre et une voix l'appelle Fils bien-aimé.",
  },
  {
    key: "opening_7",
    it: "A Cana manca il vino. Maria lo dice a Gesù, e l'acqua delle giare diventa festa.",
    en: "At Cana the wine runs out. Mary tells Jesus, and the water in the jars becomes a feast.",
    es: "En Caná falta el vino. María se lo dice a Jesús, y el agua de las tinajas se vuelve fiesta.",
    fr: "À Cana le vin manque. Marie le dit à Jésus, et l'eau des jarres devient une fête.",
  },
  {
    key: "opening_9",
    it: "Sul lago si alza la tempesta. Gesù parla al vento e all'acqua, e torna la calma.",
    en: "A storm rises on the lake. Jesus speaks to the wind and the water, and calm returns.",
    es: "En el lago se levanta la tormenta. Jesús habla al viento y al agua, y vuelve la calma.",
    fr: "Sur le lac la tempête se lève. Jésus parle au vent et à l'eau, et le calme revient.",
  },
  {
    key: "opening_10",
    it: "Cinque pani e due pesci bastano per tutti. Quello che viene condiviso non finisce.",
    en: "Five loaves and two fish are enough for everyone. What is shared does not run out.",
    es: "Cinco panes y dos peces bastan para todos. Lo que se comparte no se acaba.",
    fr: "Cinq pains et deux poissons suffisent pour tous. Ce qui est partagé ne s'épuise pas.",
  },
  {
    key: "opening_11",
    it: "A tavola, Gesù spezza il pane e lo passa ai suoi: questo è il dono che resta.",
    en: "At the table, Jesus breaks the bread and passes it to his friends: this is the gift that remains.",
    es: "En la mesa, Jesús parte el pan y lo pasa a los suyos: este es el don que permanece.",
    fr: "À table, Jésus rompt le pain et le passe aux siens : c'est le don qui demeure.",
  },
  {
    key: "opening_12",
    it: "Nel giardino, mentre gli altri dormono, Gesù prega. La notte è lunga, ma lui resta.",
    en: "In the garden, while the others sleep, Jesus prays. The night is long, but he stays.",
    es: "En el huerto, mientras los otros duermen, Jesús ora. La noche es larga, pero él se queda.",
    fr: "Dans le jardin, pendant que les autres dorment, Jésus prie. La nuit est longue, mais il reste.",
  },
  {
    key: "opening_13",
    it: "Sulla croce l'amore arriva fino in fondo. Non è la fine della storia.",
    en: "On the cross, love goes all the way. It is not the end of the story.",
    es: "En la cruz el amor llega hasta el final. No es el fin de la historia.",
    fr: "Sur la croix, l'amour va jusqu'au bout. Ce n'est pas la fin de l'histoire.",
  },
  {
    key: "opening_14",
    it: "Il sepolcro è vuoto. All'alba, la vita ha l'ultima parola.",
    en: "The tomb is empty. At dawn, life has the last word.",
    es: "El sepulcro está vacío. Al amanecer, la vida tiene la última palabra.",
    fr: "Le tombeau est vide. À l'aube, la vie a le dernier mot.",
  },
];

//* I file stage sono 0-based (op_0), lo stage di gioco parte da 1
export const openingTextKey = (stage: number): string => `opening_${Math.max(0, stage - 1)}`;
