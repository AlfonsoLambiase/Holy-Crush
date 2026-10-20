type OpeningLanguage = "it" | "en" | "es" | "fr";

export type OldTestamentOpeningText = {
  key: string;
} & Record<OpeningLanguage, string>;

//* Antico Testamento (mode_1): un testo per op_0 … op_12 (13 stage).
export const OPENING_OLD_TESTAMENT_TEXTS: OldTestamentOpeningText[] = [
  {
    key: "opening_ot_0",
    it: "Dio creò il cielo, la terra, la luce, il mare, le piante, gli animali e infine l'uomo e la donna. Il settimo giorno si riposò, benedicendo la sua creazione.",
    en: "God created the sky, the earth, light, the sea, plants, animals, and finally man and woman. On the seventh day he rested, blessing his creation.",
    es: "Dios creó el cielo, la tierra, la luz, el mar, las plantas, los animales y, por último, al hombre y a la mujer. El séptimo día descansó, bendiciendo su creación.",
    fr: "Dieu créa le ciel, la terre, la lumière, la mer, les plantes, les animaux, et enfin l'homme et la femme. Le septième jour, il se reposa en bénissant sa création.",
  },
  {
    key: "opening_ot_1",
    it: "Dio mise Adamo ed Eva nel giardino dell'Eden, vietando loro di mangiare il frutto di un albero. Ingannati dal serpente, disobbedirono a Dio e furono allontanati dal Paradiso terrestre.",
    en: "God placed Adam and Eve in the Garden of Eden, forbidding them to eat the fruit of one tree. Deceived by the serpent, they disobeyed God and were sent away from Paradise.",
    es: "Dios puso a Adán y Eva en el jardín del Edén, prohibiéndoles comer el fruto de un árbol. Engañados por la serpiente, desobedecieron a Dios y fueron expulsados del Paraíso terrenal.",
    fr: "Dieu plaça Adam et Ève dans le jardin d'Éden, en leur interdisant de manger le fruit d'un arbre. Trompés par le serpent, ils désobéirent à Dieu et furent chassés du Paradis terrestre.",
  },
  {
    key: "opening_ot_2",
    it: "Dio decise di mandare un diluvio sulla terra e ordinò a Noè di costruire un'arca per salvare la sua famiglia e gli animali. Dopo il diluvio, Noè uscì dall'arca e Dio pose l'arcobaleno come segno della sua promessa.",
    en: "God decided to send a flood upon the earth and ordered Noah to build an ark to save his family and the animals. After the flood, Noah left the ark and God set the rainbow as a sign of his promise.",
    es: "Dios decidió enviar un diluvio sobre la tierra y ordenó a Noé que construyera un arca para salvar a su familia y a los animales. Tras el diluvio, Noé salió del arca y Dios puso el arcoíris como señal de su promesa.",
    fr: "Dieu décida d'envoyer un déluge sur la terre et ordonna à Noé de construire une arche pour sauver sa famille et les animaux. Après le déluge, Noé sortit de l'arche et Dieu plaça l'arc-en-ciel comme signe de sa promesse.",
  },
  {
    key: "opening_ot_3",
    it: "Dio mise alla prova la fede di Abramo chiedendogli di sacrificare suo figlio Isacco. Quando Abramo stava per farlo, un angelo lo fermò e Dio gli fornì un ariete da sacrificare al posto del figlio.",
    en: "God tested Abraham's faith by asking him to sacrifice his son Isaac. When Abraham was about to do so, an angel stopped him and God provided a ram to sacrifice in his son's place.",
    es: "Dios puso a prueba la fe de Abraham pidiéndole que sacrificara a su hijo Isaac. Cuando Abraham estaba a punto de hacerlo, un ángel lo detuvo y Dios le proporcionó un carnero para sacrificar en lugar de su hijo.",
    fr: "Dieu mit à l'épreuve la foi d'Abraham en lui demandant de sacrifier son fils Isaac. Lorsqu'Abraham allait le faire, un ange l'arrêta et Dieu lui fournit un bélier à sacrifier à la place de son fils.",
  },
  {
    key: "opening_ot_4",
    it: "Mosè, guidato da Dio, alzò il bastone e divise le acque del Mar Rosso, permettendo agli Israeliti di attraversarlo e fuggire dall'esercito del faraone.",
    en: "Guided by God, Moses raised his staff and parted the waters of the Red Sea, allowing the Israelites to cross and escape Pharaoh's army.",
    es: "Moisés, guiado por Dios, alzó su bastón y dividió las aguas del Mar Rojo, permitiendo a los israelitas cruzarlo y huir del ejército del faraón.",
    fr: "Moïse, guidé par Dieu, leva son bâton et sépara les eaux de la mer Rouge, permettant aux Israélites de la traverser et d'échapper à l'armée du pharaon.",
  },
  {
    key: "opening_ot_5",
    it: "Gli uomini decisero di costruire una città con una torre altissima per raggiungere il cielo. Dio confuse le loro lingue, impedendo loro di capirsi, e li disperse sulla terra.",
    en: "People decided to build a city with a towering structure to reach the sky. God confused their languages so they could no longer understand one another and scattered them across the earth.",
    es: "Los hombres decidieron construir una ciudad con una torre muy alta para alcanzar el cielo. Dios confundió sus lenguas, impidiéndoles entenderse, y los dispersó por la tierra.",
    fr: "Les hommes décidèrent de bâtir une ville avec une tour très haute pour atteindre le ciel. Dieu confondit leurs langues, les empêchant de se comprendre, et les dispersa sur la terre.",
  },
  {
    key: "opening_ot_6",
    it: "Il faraone teneva schiavi gli Israeliti e si rifiutava di liberarli. Dio mandò dieci piaghe sull'Egitto e, dopo l'ultima, il faraone permise finalmente al popolo di partire con Mosè.",
    en: "Pharaoh kept the Israelites enslaved and refused to set them free. God sent ten plagues upon Egypt, and after the last one, Pharaoh finally allowed the people to leave with Moses.",
    es: "El faraón mantenía esclavizados a los israelitas y se negaba a liberarlos. Dios envió diez plagas sobre Egipto y, tras la última, el faraón permitió por fin que el pueblo partiera con Moisés.",
    fr: "Le pharaon tenait les Israélites en esclavage et refusait de les libérer. Dieu envoya dix plaies sur l'Égypte et, après la dernière, le pharaon permit enfin au peuple de partir avec Moïse.",
  },
  {
    key: "opening_ot_7",
    it: "Golia, un gigantesco guerriero filisteo, sfidò gli Israeliti, ma il giovane Davide accettò di affrontarlo confidando in Dio. Con una pietra lanciata dalla fionda, Davide colpì Golia e salvò il suo popolo.",
    en: "Goliath, a giant Philistine warrior, challenged the Israelites, but young David agreed to face him trusting in God. With a stone from his sling, David struck Goliath and saved his people.",
    es: "Goliat, un gigantesco guerrero filisteo, desafió a los israelitas, pero el joven David aceptó enfrentarlo confiando en Dios. Con una piedra lanzada con la honda, David golpeó a Goliat y salvó a su pueblo.",
    fr: "Goliath, un guerrier philistin géant, défia les Israélites, mais le jeune David accepta de l'affronter en confiant en Dieu. D'une pierre lancée avec sa fronde, David frappa Goliath et sauva son peuple.",
  },
  {
    key: "opening_ot_8",
    it: "Sul monte Sinai, Dio consegnò a Mosè le tavole con i dieci comandamenti. Queste leggi insegnavano agli Israeliti a rispettare Dio e il prossimo e a vivere secondo la sua volontà.",
    en: "On Mount Sinai, God gave Moses the tablets of the Ten Commandments. These laws taught the Israelites to honor God and their neighbor and to live according to his will.",
    es: "En el monte Sinaí, Dios entregó a Moisés las tablas de los diez mandamientos. Estas leyes enseñaban a los israelitas a respetar a Dios y al prójimo y a vivir según su voluntad.",
    fr: "Sur le mont Sinaï, Dieu remit à Moïse les tables des dix commandements. Ces lois enseignaient aux Israélites à respecter Dieu et le prochain et à vivre selon sa volonté.",
  },
  {
    key: "opening_ot_9",
    it: "Invidiosi di Giuseppe, i suoi fratelli lo vendettero come schiavo a dei mercanti diretti in Egitto. Dopo molte difficoltà, Giuseppe diventò un uomo importante e riuscì a salvare la sua famiglia dalla carestia.",
    en: "Jealous of Joseph, his brothers sold him as a slave to merchants bound for Egypt. After many hardships, Joseph became a powerful man and was able to save his family from famine.",
    es: "Envidiosos de José, sus hermanos lo vendieron como esclavo a unos mercaderes rumbo a Egipto. Tras muchas dificultades, José llegó a ser un hombre importante y logró salvar a su familia de la hambruna.",
    fr: "Jaloux de Joseph, ses frères le vendirent comme esclave à des marchands en route pour l'Égypte. Après bien des épreuves, Joseph devint un homme influent et parvint à sauver sa famille de la famine.",
  },
  {
    key: "opening_ot_10",
    it: "Nel 587/586 a.C., i Babilonesi conquistarono Gerusalemme, distrussero il Tempio e deportarono molti abitanti a Babilonia. Il popolo ebraico perse così la propria città santa e il suo principale luogo di culto.",
    en: "In 587/586 BC, the Babylonians conquered Jerusalem, destroyed the Temple, and deported many inhabitants to Babylon. The Jewish people thus lost their holy city and their main place of worship.",
    es: "En 587/586 a. C., los babilonios conquistaron Jerusalén, destruyeron el Templo y deportaron a muchos habitantes a Babilonia. El pueblo judío perdió así su ciudad santa y su principal lugar de culto.",
    fr: "En 587/586 av. J.-C., les Babyloniens conquirent Jérusalem, détruisirent le Temple et déportèrent de nombreux habitants à Babylone. Le peuple juif perdit ainsi sa ville sainte et son principal lieu de culte.",
  },
  {
    key: "opening_ot_11",
    it: "Dopo l'esilio a Babilonia, gli Ebrei ottennero il permesso di tornare a Gerusalemme. Ricostruirono il Tempio e, sotto la guida di Neemia, ripararono le mura della città, ristabilendo la vita religiosa e comunitaria.",
    en: "After the exile in Babylon, the Jews were allowed to return to Jerusalem. They rebuilt the Temple and, under Nehemiah's guidance, restored the city walls, renewing religious and community life.",
    es: "Tras el exilio en Babilonia, los judíos obtuvieron permiso para volver a Jerusalén. Reconstruyeron el Templo y, bajo la guía de Nehemías, repararon las murallas de la ciudad, restableciendo la vida religiosa y comunitaria.",
    fr: "Après l'exil à Babylone, les Juifs obtinrent la permission de revenir à Jérusalem. Ils reconstruisirent le Temple et, sous la direction de Néhémie, restaurèrent les murailles de la ville, rétablissant la vie religieuse et communautaire.",
  },
  {
    key: "opening_ot_12",
    it: "La storia che conosciamo è finita, ma ne resta ancora una da scrivere quella più importante: la tua!",
    en: "The story we know is over, but one story remains to be written—the most important one: yours!",
    es: "La historia que conocemos ha terminado, pero aún queda una por escribir, la más importante: ¡la tuya!",
    fr: "L'histoire que nous connaissons est terminée, mais il en reste une à écrire, la plus importante : la vôtre !",
  },
];

export const oldTestamentOpeningKey = (stage: number): string => {
  const index = Math.min(Math.max(0, stage - 1), OPENING_OLD_TESTAMENT_TEXTS.length - 1);

  return OPENING_OLD_TESTAMENT_TEXTS[index].key;
};
