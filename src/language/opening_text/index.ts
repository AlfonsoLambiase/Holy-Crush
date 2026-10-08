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
    es: "En Belén, en un pesebre, nace Jesús. La estrella llama a pastores y magos a inclinarse ante él.",
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
    it: "Dopo la morte di Erode, Giuseppe riceve un nuovo avvertimento e torna con Maria e Gesù. La famiglia si stabilisce a Nazaret, dove il bambino cresce.",
    en: "After Herod's death, Joseph receives a new warning and returns with Mary and Jesus. The family settles in Nazareth, where the child grows up.",
    es: "Tras la muerte de Herodes, José recibe un nuevo aviso y vuelve con María y Jesús. La familia se establece en Nazaret, donde crece el niño.",
    fr: "Après la mort d'Hérode, Joseph reçoit un nouvel avertissement et revient avec Marie et Jésus. La famille s'installe à Nazareth, où l'enfant grandit.",
  },
  {
    key: "opening_5",
    it: "A quindici anni, Gesù entra nel Tempio e parla con i maestri. Le sue parole sorprendono chi lo ascolta.",
    en: "At fifteen, Jesus enters the Temple and speaks with the teachers. His words surprise those who listen.",
    es: "A los quince años, Jesús entra en el Templo y habla con los maestros. Sus palabras sorprenden a quienes lo escuchan.",
    fr: "À quinze ans, Jésus entre au Temple et parle avec les maîtres. Ses paroles surprennent ceux qui l'écoutent.",
  },
  {
    key: "opening_6",
    it: "Gesù incontra Giovanni Battista sulle rive del Giordano. Giovanni lo battezza e lo Spirito scende su di lui.",
    en: "Jesus meets John the Baptist on the banks of the Jordan. John baptizes him and the Spirit descends upon him.",
    es: "Jesús encuentra a Juan el Bautista a orillas del Jordán. Juan lo bautiza y el Espíritu desciende sobre él.",
    fr: "Jésus rencontre Jean-Baptiste sur les rives du Jourdain. Jean le baptise et l'Esprit descend sur lui.",
  },
  {
    key: "opening_7",
    it: "Gesù si ritira nel deserto per quaranta giorni. Lì affronta la tentazione e sceglie di seguire la volontà di Dio.",
    en: "Jesus withdraws into the desert for forty days. There he faces temptation and chooses to follow God's will.",
    es: "Jesús se retira al desierto durante cuarenta días. Allí afronta la tentación y elige seguir la voluntad de Dios.",
    fr: "Jésus se retire dans le désert pendant quarante jours. Là il affronte la tentation et choisit de suivre la volonté de Dieu.",
  },
  {
    key: "opening_8",
    it: "Gesù chiama a sé i suoi dodici apostoli. Uno dopo l'altro, lasciano tutto per seguirlo e camminare con lui.",
    en: "Jesus calls his twelve apostles to himself. One after another, they leave everything to follow him and walk with him.",
    es: "Jesús llama a sus doce apóstoles. Uno tras otro, dejan todo para seguirlo y caminar con él.",
    fr: "Jésus appelle auprès de lui ses douze apôtres. L'un après l'autre, ils laissent tout pour le suivre et marcher avec lui.",
  },
  {
    key: "opening_9",
    it: "Gesù incontra persone malate e sofferenti: zoppi, ciechi, muti e lebbrosi. Con le sue parole e i suoi gesti porta loro guarigione e speranza.",
    en: "Jesus meets sick and suffering people: the lame, the blind, the mute, and lepers. With his words and deeds he brings them healing and hope.",
    es: "Jesús encuentra a enfermos y sufrientes: cojos, ciegos, mudos y leprosos. Con sus palabras y gestos les trae sanación y esperanza.",
    fr: "Jésus rencontre des malades et des souffrants : boiteux, aveugles, muets et lépreux. Par ses paroles et ses gestes, il leur apporte guérison et espérance.",
  },
  {
    key: "opening_10",
    it: "Davanti a una grande folla affamata, Gesù prende pochi pani e pesci. Li benedice e il cibo basta per tutti.",
    en: "Before a large hungry crowd, Jesus takes a few loaves and fish. He blesses them and the food is enough for everyone.",
    es: "Ante una gran multitud hambrienta, Jesús toma unos pocos panes y peces. Los bendice y la comida alcanza para todos.",
    fr: "Devant une grande foule affamée, Jésus prend quelques pains et poissons. Il les bénit et la nourriture suffit pour tous.",
  },
  {
    key: "opening_11",
    it: "Durante una festa di nozze, l'acqua nelle giare diventa vino. È il primo grande segno compiuto da Gesù.",
    en: "During a wedding feast, the water in the jars becomes wine. It is the first great sign performed by Jesus.",
    es: "Durante una fiesta de bodas, el agua de las tinajas se convierte en vino. Es la primera gran señal realizada por Jesús.",
    fr: "Lors d'une fête de noces, l'eau des jarres devient du vin. C'est le premier grand signe accompli par Jésus.",
  },
  {
    key: "opening_12",
    it: "Sul lago, nella notte, Gesù cammina sulle acque. I suoi apostoli lo vedono arrivare tra le onde e rimangono stupiti.",
    en: "On the lake, at night, Jesus walks on the water. His apostles see him coming through the waves and are astonished.",
    es: "En el lago, de noche, Jesús camina sobre las aguas. Sus apóstoles lo ven llegar entre las olas y quedan asombrados.",
    fr: "Sur le lac, dans la nuit, Jésus marche sur les eaux. Ses apôtres le voient arriver à travers les vagues et restent stupéfaits.",
  },
  {
    key: "opening_13",
    it: "Nel Tempio, Gesù vede il mercato e i mercanti che hanno trasformato la casa di Dio in un luogo di commercio. Con rabbia li scaccia e difende la sacralità del Tempio.",
    en: "In the Temple, Jesus sees the market and merchants who have turned God's house into a place of trade. In anger he drives them out and defends the Temple's holiness.",
    es: "En el Templo, Jesús ve el mercado y a los mercaderes que han convertido la casa de Dios en un lugar de comercio. Con ira los expulsa y defiende la santidad del Templo.",
    fr: "Au Temple, Jésus voit le marché et les marchands qui ont transformé la maison de Dieu en lieu de commerce. Avec colère, il les chasse et défend la sainteté du Temple.",
  },
  {
    key: "opening_14",
    it: "Gesù entra a Gerusalemme come un re, cavalcando un asino. La folla lo accoglie con rami e grida di gioia.",
    en: "Jesus enters Jerusalem as a king, riding a donkey. The crowd welcomes him with branches and shouts of joy.",
    es: "Jesús entra en Jerusalén como un rey, montado en un asno. La multitud lo recibe con ramas y gritos de alegría.",
    fr: "Jésus entre à Jérusalem comme un roi, monté sur un âne. La foule l'accueille avec des branches et des cris de joie.",
  },
  {
    key: "opening_15",
    it: "Dopo l'Ultima Cena, Giuda conduce le guardie fino a Gesù. Poi lo tradisce con un bacio, consegnandolo nelle loro mani.",
    en: "After the Last Supper, Judas leads the guards to Jesus. Then he betrays him with a kiss, handing him over to them.",
    es: "Tras la Última Cena, Judas conduce a las guardias hasta Jesús. Luego lo traiciona con un beso, entregándolo en sus manos.",
    fr: "Après la Cène, Judas conduit les gardes jusqu'à Jésus. Puis il le trahit d'un baiser, le livrant entre leurs mains.",
  },
  {
    key: "opening_16",
    it: "Gesù viene portato davanti a Ponzio Pilato. Nonostante le accuse, Pilato lo condanna alla crocifissione.",
    en: "Jesus is brought before Pontius Pilate. Despite the accusations, Pilate condemns him to crucifixion.",
    es: "Jesús es llevado ante Poncio Pilato. A pesar de las acusaciones, Pilato lo condena a la crucifixión.",
    fr: "Jésus est amené devant Ponce Pilate. Malgré les accusations, Pilate le condamne à la crucifixion.",
  },
  {
    key: "opening_17",
    it: "Gesù viene condotto sul Golgota e crocifisso. Sulla croce affronta la sofferenza fino alla morte.",
    en: "Jesus is led to Golgotha and crucified. On the cross he endures suffering until death.",
    es: "Jesús es llevado al Gólgota y crucificado. En la cruz soporta el sufrimiento hasta la muerte.",
    fr: "Jésus est conduit au Golgotha et crucifié. Sur la croix, il affronte la souffrance jusqu'à la mort.",
  },
  {
    key: "opening_18",
    it: "Il terzo giorno, le donne trovano il sepolcro vuoto. Gesù è risorto: la morte non ha avuto l'ultima parola.",
    en: "On the third day, the women find the tomb empty. Jesus has risen: death did not have the last word.",
    es: "Al tercer día, las mujeres encuentran el sepulcro vacío. Jesús ha resucitado: la muerte no tuvo la última palabra.",
    fr: "Le troisième jour, les femmes trouvent le tombeau vide. Jésus est ressuscité : la mort n'a pas eu le dernier mot.",
  },
  {
    key: "opening_19",
    it: "Gesù risorto torna dai suoi apostoli. Si mostra loro, parla con loro e porta la certezza che è davvero vivo.",
    en: "The risen Jesus returns to his apostles. He shows himself to them, speaks with them, and brings the certainty that he is truly alive.",
    es: "Jesús resucitado vuelve junto a sus apóstoles. Se les manifiesta, habla con ellos y les da la certeza de que está realmente vivo.",
    fr: "Jésus ressuscité revient vers ses apôtres. Il se montre à eux, leur parle et leur apporte la certitude qu'il est vraiment vivant.",
  },
];

//* I file stage sono 0-based (op_0), lo stage di gioco parte da 1
export const openingTextKey = (stage: number): string => `opening_${Math.max(0, stage - 1)}`;
