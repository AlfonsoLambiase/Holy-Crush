import type {LocalizedVerseFields} from "./stage-verse-i18n";

export type LevelVerse = LocalizedVerseFields & {
  /** Numero livello globale: stage 1 → 1–20, stage 2 → 21–40, … */
  level: number;
};

export type StageVerseSet = {
  /** Stage di gioco 1–20 (STAGE_0 nel content = 1). */
  stage: number;
  /** 20 versetti in ordine (indice 0 = primo livello dello stage). */
  levels: LevelVerse[];
};

/** Versetto prima di ogni livello; `level` globale = (stage − 1) × 20 + posizione. */
export const STAGE_VERSE_SETS: StageVerseSet[] = [
  {
    stage: 1,
    levels: [
      {
        level: 1,
        reference: { it: "Luca 1,26" },
        text: { it: "Nel sesto mese, Dio mandò l'angelo Gabriele in una città della Galilea, chiamata Nazaret." },
      },
      {
        level: 2,
        reference: { it: "Luca 1,27" },
        text: { it: "L'angelo fu mandato a una vergine promessa sposa di un uomo della casa di Davide, di nome Giuseppe; e la vergine si chiamava Maria." },
      },
      {
        level: 3,
        reference: { it: "Luca 1,28" },
        text: { it: "Entrando da lei, l'angelo le disse: “Rallegrati, piena di grazia; il Signore è con te”." },
      },
      {
        level: 4,
        reference: { it: "Luca 1,29" },
        text: { it: "A queste parole Maria rimase turbata e si domandava quale fosse il significato di quel saluto." },
      },
      {
        level: 5,
        reference: { it: "Luca 1,30" },
        text: { it: "L'angelo le disse: “Non temere, Maria, perché hai trovato grazia presso Dio.”" },
      },
      {
        level: 6,
        reference: { it: "Luca 1,31" },
        text: { it: "“Ecco, concepirai un figlio, lo darai alla luce e lo chiamerai Gesù.”" },
      },
      {
        level: 7,
        reference: { it: "Luca 1,32-33" },
        text: { it: "“Egli sarà grande e sarà chiamato Figlio dell'Altissimo; il Signore Dio gli darà il trono di Davide, suo padre, e regnerà per sempre sulla casa di Giacobbe; il suo regno non avrà fine.”" },
      },
      {
        level: 8,
        reference: { it: "Luca 1,39" },
        text: { it: "In quei giorni Maria si alzò e andò in fretta verso la regione montuosa, in una città di Giuda." },
      },
      {
        level: 9,
        reference: { it: "Luca 1,34" },
        text: { it: "Maria disse all'angelo: “Come potrà accadere questo, dal momento che non conosco uomo?”" },
      },
      {
        level: 10,
        reference: { it: "Luca 1,35" },
        text: { it: "L'angelo le rispose: “Lo Spirito Santo scenderà su di te e la potenza dell'Altissimo ti coprirà con la sua ombra. Per questo il bambino che nascerà sarà santo e sarà chiamato Figlio di Dio.”" },
      },
      {
        level: 11,
        reference: { it: "Luca 1,36" },
        text: { it: "“E anche Elisabetta, tua parente, nella sua vecchiaia ha concepito un figlio e questo è il sesto mese per lei, che era considerata sterile.”" },
      },
      {
        level: 12,
        reference: { it: "Luca 1,37" },
        text: { it: "“Perché nulla è impossibile a Dio.”" },
      },
      {
        level: 13,
        reference: { it: "Luca 1,38" },
        text: { it: "Maria disse: “Ecco, sono la serva del Signore: avvenga per me secondo la tua parola”. E l'angelo si allontanò da lei." },
      },
      {
        level: 14,
        reference: { it: "Matteo 1,18" },
        text: { it: "La nascita di Gesù Cristo avvenne in questo modo: Maria, sua madre, era promessa sposa di Giuseppe; prima che andassero a vivere insieme, si trovò incinta per opera dello Spirito Santo." },
      },
      {
        level: 15,
        reference: { it: "Matteo 1,19" },
        text: { it: "Giuseppe, suo sposo, che era un uomo giusto e non voleva esporla alla vergogna pubblicamente, decise di lasciarla in segreto." },
      },
      {
        level: 16,
        reference: { it: "Matteo 1,20" },
        text: { it: "Mentre stava pensando a queste cose, gli apparve in sogno un angelo del Signore e gli disse: “Giuseppe, figlio di Davide, non aver paura di prendere con te Maria, tua sposa, perché il bambino che è stato concepito in lei viene dallo Spirito Santo.”" },
      },
      {
        level: 17,
        reference: { it: "Matteo 1,21" },
        text: { it: "“Maria darà alla luce un figlio e tu lo chiamerai Gesù, perché egli salverà il suo popolo dai suoi peccati.”" },
      },
      {
        level: 18,
        reference: { it: "Matteo 1,22" },
        text: { it: "Tutto questo avvenne perché si compisse ciò che il Signore aveva detto per mezzo del profeta, dicendo:" },
      },
      {
        level: 19,
        reference: { it: "Matteo 1,23" },
        text: { it: "Ecco, la vergine concepirà e darà alla luce un figlio, che sarà chiamato Emmanuele, che significa: “Dio con noi”." },
      },
      {
        level: 20,
        reference: { it: "Matteo 1,24" },
        text: { it: "Quando Giuseppe si svegliò, fece ciò che l'angelo del Signore gli aveva comandato e prese con sé la sua sposa." },
      },
    ],
  },
  {
    stage: 2,
    levels: [
      {
        level: 21,
        reference: { it: "Luca 2,1" },
        text: { it: "In quei giorni l'imperatore Augusto emanò un decreto con cui ordinava di fare il censimento di tutta la popolazione." },
      },
      {
        level: 22,
        reference: { it: "Luca 2,2" },
        text: { it: "Questo fu il primo censimento, quando Quirinio era governatore della Siria." },
      },
      {
        level: 23,
        reference: { it: "Luca 2,3-4" },
        text: { it: "Tutti dovevano andare nella propria città per essere registrati. Anche Giuseppe partì da Nazaret, in Galilea, e salì in Giudea, nella città di Davide chiamata Betlemme, perché apparteneva alla famiglia e alla discendenza di Davide." },
      },
      {
        level: 24,
        reference: { it: "Luca 2,5" },
        text: { it: "Andò a farsi registrare insieme a Maria, sua sposa, che era incinta." },
      },
      {
        level: 25,
        reference: { it: "Luca 2,6-7" },
        text: { it: "Mentre si trovavano a Betlemme, arrivò per Maria il momento di partorire. Diede alla luce il suo figlio primogenito, lo avvolse in fasce e lo depose in una mangiatoia, perché per loro non c'era posto nell'alloggio." },
      },
      {
        level: 26,
        reference: { it: "Luca 2,8" },
        text: { it: "In quella stessa regione c'erano alcuni pastori che passavano la notte all'aperto e vegliavano sul loro gregge." },
      },
      {
        level: 27,
        reference: { it: "Luca 2,9" },
        text: { it: "All'improvviso apparve loro un angelo del Signore e la gloria del Signore li avvolse di luce. Essi ebbero molta paura." },
      },
      {
        level: 28,
        reference: { it: "Luca 2,10" },
        text: { it: "Ma l'angelo disse loro: “Non abbiate paura. Vi annuncio una grande gioia, che sarà per tutto il popolo.”" },
      },
      {
        level: 29,
        reference: { it: "Luca 2,11" },
        text: { it: "“Oggi, nella città di Davide, è nato per voi un Salvatore, che è Cristo, il Signore.”" },
      },
      {
        level: 30,
        reference: { it: "Luca 2,12" },
        text: { it: "“Questo sarà il segno per riconoscerlo: troverete un bambino avvolto in fasce e deposto in una mangiatoia.”" },
      },
      {
        level: 31,
        reference: { it: "Luca 2,13-14" },
        text: { it: "All'improvviso apparve insieme all'angelo una moltitudine dell'esercito celeste, che lodava Dio dicendo: “Gloria a Dio nell'alto dei cieli e pace sulla terra agli uomini che egli ama.”" },
      },
      {
        level: 32,
        reference: { it: "Luca 2,15" },
        text: { it: "Quando gli angeli se ne furono andati verso il cielo, i pastori si dissero l'un l'altro: “Andiamo subito a Betlemme e vediamo ciò che è accaduto e che il Signore ci ha fatto conoscere.”" },
      },
      {
        level: 33,
        reference: { it: "Luca 2,16" },
        text: { it: "Andarono dunque in fretta e trovarono Maria, Giuseppe e il bambino, che era deposto nella mangiatoia." },
      },
      {
        level: 34,
        reference: { it: "Luca 2,17-18" },
        text: { it: "Dopo averlo visto, raccontarono ciò che era stato detto loro riguardo a quel bambino. Tutti quelli che ascoltavano i pastori rimasero meravigliati di ciò che raccontavano." },
      },
      {
        level: 35,
        reference: { it: "Luca 2,19" },
        text: { it: "Maria, invece, custodiva tutte queste cose e le meditava nel suo cuore." },
      },
      {
        level: 36,
        reference: { it: "Luca 2,20" },
        text: { it: "I pastori tornarono indietro, glorificando e lodando Dio per tutto quello che avevano udito e visto, proprio come era stato loro annunciato." },
      },
      {
        level: 37,
        reference: { it: "Matteo 1,18" },
        text: { it: "La nascita di Gesù Cristo avvenne in questo modo: Maria, sua madre, era promessa sposa di Giuseppe, ma prima che vivessero insieme si trovò incinta per opera dello Spirito Santo." },
      },
      {
        level: 38,
        reference: { it: "Matteo 1,21" },
        text: { it: "Maria partorirà un figlio e tu lo chiamerai Gesù, perché egli salverà il suo popolo dai suoi peccati." },
      },
      {
        level: 39,
        reference: { it: "Matteo 2,1" },
        text: { it: "Gesù nacque a Betlemme di Giudea, al tempo del re Erode. Dopo la sua nascita, alcuni Magi arrivarono dall'Oriente a Gerusalemme." },
      },
      {
        level: 40,
        reference: { it: "Matteo 2,2" },
        text: { it: "Essi domandavano: “Dov'è il re dei Giudei che è nato? Abbiamo visto sorgere la sua stella e siamo venuti per adorarlo.”" },
      },
    ],
  },
  {
    stage: 3,
    levels: [
      {
        level: 41,
        reference: { it: "Matteo 2,3" },
        text: { it: "Quando il re Erode venne a sapere queste cose, ne rimase turbato, e con lui tutta Gerusalemme." },
      },
      {
        level: 42,
        reference: { it: "Matteo 2,2" },
        text: { it: "Essi domandavano: “Dov'è il re dei Giudei che è nato? Abbiamo visto sorgere la sua stella e siamo venuti per adorarlo”." },
      },
      {
        level: 43,
        reference: { it: "Matteo 2,3" },
        text: { it: "Quando il re Erode venne a sapere queste cose, rimase molto turbato, e con lui tutta Gerusalemme." },
      },
      {
        level: 44,
        reference: { it: "Matteo 2,4" },
        text: { it: "Riunì tutti i capi dei sacerdoti e gli scribi del popolo e domandò loro dove doveva nascere il Cristo." },
      },
      {
        level: 45,
        reference: { it: "Matteo 2,5" },
        text: { it: "Essi gli risposero: “A Betlemme di Giudea, perché così è stato scritto per mezzo del profeta:”" },
      },
      {
        level: 46,
        reference: { it: "Matteo 2,6" },
        text: { it: "“E tu, Betlemme, terra di Giuda, non sei affatto la più piccola tra le città principali di Giuda: da te infatti uscirà un capo che guiderà il mio popolo, Israele”." },
      },
      {
        level: 47,
        reference: { it: "Matteo 2,7" },
        text: { it: "Allora Erode chiamò di nascosto i Magi e si fece dire da loro con precisione quando era apparsa la stella." },
      },
      {
        level: 48,
        reference: { it: "Matteo 2,8" },
        text: { it: "Poi li mandò a Betlemme dicendo: “Andate e cercate con attenzione il bambino e, quando lo avrete trovato, fatemelo sapere, perché anch'io venga ad adorarlo”." },
      },
      {
        level: 49,
        reference: { it: "Matteo 2,9" },
        text: { it: "Dopo aver ascoltato il re, essi partirono. Ed ecco, la stella che avevano visto sorgere li precedeva, finché arrivò e si fermò sopra il luogo dove si trovava il bambino." },
      },
      {
        level: 50,
        reference: { it: "Matteo 2,10" },
        text: { it: "Quando videro la stella, provarono una grandissima gioia." },
      },
      {
        level: 51,
        reference: { it: "Matteo 2,11" },
        text: { it: "Entrati nella casa, videro il bambino con Maria, sua madre; si inginocchiarono davanti a lui e lo adorarono. Poi aprirono i loro tesori e gli offrirono in dono oro, incenso e mirra." },
      },
      {
        level: 52,
        reference: { it: "Matteo 2,12" },
        text: { it: "Avvertiti in sogno di non tornare da Erode, fecero ritorno al loro paese per un'altra strada." },
      },
      {
        level: 53,
        reference: { it: "Luca 2,15" },
        text: { it: "Quando gli angeli se ne furono andati verso il cielo, i pastori si dissero l'un l'altro: “Andiamo subito a Betlemme e vediamo ciò che è accaduto e che il Signore ci ha fatto conoscere”." },
      },
      {
        level: 54,
        reference: { it: "Luca 2,18" },
        text: { it: "Tutti quelli che ascoltarono si meravigliarono delle cose dette loro dai pastori." },
      },
      {
        level: 55,
        reference: { it: "Luca 2,17" },
        text: { it: "Dopo averlo visto, raccontarono ciò che era stato detto loro riguardo a quel bambino." },
      },
      {
        level: 56,
        reference: { it: "Luca 2,21" },
        text: { it: "Al compimento di otto giorni, venne circonciso e gli fu dato il nome di Gesù, come l'angelo gli aveva indicato prima della sua concezione." },
      },
      {
        level: 57,
        reference: { it: "Matteo 1,21" },
        text: { it: "Maria darà alla luce un figlio e tu lo chiamerai Gesù, perché egli salverà il suo popolo dai suoi peccati." },
      },
      {
        level: 58,
        reference: { it: "Luca 2,25" },
        text: { it: "C'era a Gerusalemme un uomo di nome Simeone, giusto e devoto, che aspettava la consolazione di Israele, e lo Spirito Santo era su di lui." },
      },
      {
        level: 59,
        reference: { it: "Luca 2,32" },
        text: { it: "Luce per illuminare le genti e gloria del tuo popolo, Israele." },
      },
      {
        level: 60,
        reference: { it: "Giovanni 1,9" },
        text: { it: "Veniva nel mondo la vera luce, quella che illumina ogni uomo." },
      },
    ],
  },
  {
    stage: 4,
    levels: [
      {
        level: 61,
        reference: { it: "Matteo 2,13" },
        text: { it: "Dopo che i Magi furono partiti, un angelo del Signore apparve in sogno a Giuseppe e gli disse: “Alzati, prendi con te il bambino e sua madre, fuggi in Egitto e rimani là finché non ti avvertirò, perché Erode sta cercando il bambino per ucciderlo”." },
      },
      {
        level: 62,
        reference: { it: "Matteo 2,14" },
        text: { it: "Giuseppe si alzò, prese con sé il bambino e sua madre durante la notte e partì verso l'Egitto." },
      },
      {
        level: 63,
        reference: { it: "Matteo 2,15" },
        text: { it: "Rimase là fino alla morte di Erode, affinché si compisse ciò che il Signore aveva detto per mezzo del profeta: “Dall'Egitto ho chiamato mio figlio”." },
      },
      {
        level: 64,
        reference: { it: "Matteo 2,16" },
        text: { it: "Quando Erode si rese conto che i Magi lo avevano ingannato, si infuriò terribilmente e ordinò di uccidere tutti i bambini di Betlemme e del suo territorio che avevano due anni o meno, secondo il tempo che aveva stabilito dai Magi." },
      },
      {
        level: 65,
        reference: { it: "Matteo 2,17-18" },
        text: { it: "Così si compì ciò che era stato detto per mezzo del profeta Geremia: “Una voce è stata udita in Rama, un pianto e un lamento grande: Rachele piange i suoi figli e non vuole essere consolata, perché non sono più”." },
      },
      {
        level: 66,
        reference: { it: "Matteo 1,20" },
        text: { it: "Mentre Giuseppe stava pensando a queste cose, un angelo del Signore gli apparve in sogno e gli disse: “Giuseppe, figlio di Davide, non aver paura di prendere con te Maria, tua sposa, perché il bambino che è stato concepito in lei viene dallo Spirito Santo”." },
      },
      {
        level: 67,
        reference: { it: "Matteo 1,21" },
        text: { it: "“Maria darà alla luce un figlio e tu lo chiamerai Gesù, perché egli salverà il suo popolo dai suoi peccati”." },
      },
      {
        level: 68,
        reference: { it: "Matteo 1,22-23" },
        text: { it: "Tutto questo avvenne perché si compisse ciò che il Signore aveva detto per mezzo del profeta: “Ecco, la vergine concepirà e darà alla luce un figlio, che sarà chiamato Emmanuele”, che significa: “Dio con noi”." },
      },
      {
        level: 69,
        reference: { it: "Luca 2,23" },
        text: { it: "Come è scritto nella legge del Signore: «Ogni maschio primogenito sarà dedicato al Signore»," },
      },
      {
        level: 70,
        reference: { it: "Matteo 1,25" },
        text: { it: "Ma non ebbe rapporti con lei finché non ebbe partorito il figlio, che chiamò Gesù." },
      },
      {
        level: 71,
        reference: { it: "Matteo 2,19" },
        text: { it: "Dopo la morte di Erode, un angelo del Signore apparve in sogno a Giuseppe, in Egitto." },
      },
      {
        level: 72,
        reference: { it: "Matteo 2,20" },
        text: { it: "E gli disse: “Alzati, prendi con te il bambino e sua madre e torna nella terra d'Israele, perché sono morti quelli che cercavano di uccidere il bambino”." },
      },
      {
        level: 73,
        reference: { it: "Matteo 2,21" },
        text: { it: "Giuseppe si alzò, prese con sé il bambino e sua madre e tornò nella terra d'Israele." },
      },
      {
        level: 74,
        reference: { it: "Matteo 2,22" },
        text: { it: "Ma quando seppe che in Giudea regnava Archelao al posto di suo padre Erode, ebbe paura di andare là. Avvertito in sogno, si ritirò nella regione della Galilea." },
      },
      {
        level: 75,
        reference: { it: "Matteo 2,23" },
        text: { it: "Andò ad abitare in una città chiamata Nazaret, affinché si compisse ciò che era stato detto per mezzo dei profeti: “Sarà chiamato Nazareno”." },
      },
      {
        level: 76,
        reference: { it: "Luca 2,4" },
        text: { it: "Anche Giuseppe partì da Nazaret, in Galilea, e salì in Giudea, nella città di Davide chiamata Betlemme, perché apparteneva alla famiglia e alla discendenza di Davide." },
      },
      {
        level: 77,
        reference: { it: "Luca 2,24" },
        text: { it: "e per offrire in sacrificio, come è prescritto nella legge del Signore, «un paio di tortore o due giovani colombi»." },
      },
      {
        level: 78,
        reference: { it: "Luca 2,27" },
        text: { it: "Guidato dallo Spirito, egli si recò nel tempio e, quando i genitori portarono il bambino Gesù per compiere quanto prescriveva la legge a suo riguardo," },
      },
      {
        level: 79,
        reference: { it: "Luca 2,22" },
        text: { it: "Quando furono compiuti i giorni della loro purificazione secondo la legge di Mosè, portarono il bambino a Gerusalemme per presentarlo al Signore." },
      },
      {
        level: 80,
        reference: { it: "Luca 2,39" },
        text: { it: "Quando ebbero compiuto tutto ciò che era richiesto dalla legge del Signore, tornarono in Galilea, nella loro città di Nazaret." },
      },
    ],
  },
  {
    stage: 5,
    levels: [
      {
        level: 81,
        reference: { it: "Matteo 2,19" },
        text: { it: "Dopo la morte di Erode, un angelo del Signore apparve in sogno a Giuseppe, mentre si trovava in Egitto." },
      },
      {
        level: 82,
        reference: { it: "Matteo 2,20" },
        text: { it: "L'angelo gli disse: “Alzati, prendi con te il bambino e sua madre e torna nella terra d'Israele, perché sono morti quelli che cercavano di uccidere il bambino”." },
      },
      {
        level: 83,
        reference: { it: "Luca 2,29" },
        text: { it: "Ora, Signore, lascia che il tuo servo vada in pace, secondo la tua parola:" },
      },
      {
        level: 84,
        reference: { it: "Luca 2,30" },
        text: { it: "perché i miei occhi hanno visto la tua salvezza," },
      },
      {
        level: 85,
        reference: { it: "Luca 2,31" },
        text: { it: "che tu hai preparato davanti ai popoli:" },
      },
      {
        level: 86,
        reference: { it: "Luca 2,33" },
        text: { it: "Il padre e la madre di Gesù restavano meravigliati di quanto si diceva di lui." },
      },
      {
        level: 87,
        reference: { it: "Luca 2,40" },
        text: { it: "Il bambino cresceva e diventava forte, pieno di sapienza, e la grazia di Dio era su di lui." },
      },
      {
        level: 88,
        reference: { it: "Luca 2,41" },
        text: { it: "I suoi genitori andavano ogni anno a Gerusalemme per la festa di Pasqua." },
      },
      {
        level: 89,
        reference: { it: "Luca 2,42" },
        text: { it: "Quando Gesù ebbe dodici anni, salirono a Gerusalemme secondo l'usanza della festa." },
      },
      {
        level: 90,
        reference: { it: "Luca 2,43" },
        text: { it: "Terminati i giorni della festa, mentre tornavano indietro, il ragazzo Gesù rimase a Gerusalemme senza che i suoi genitori se ne accorgessero." },
      },
      {
        level: 91,
        reference: { it: "Luca 2,44" },
        text: { it: "Pensando che fosse nella compagnia dei viaggiatori, fecero una giornata di cammino e poi cominciarono a cercarlo tra i parenti e i conoscenti." },
      },
      {
        level: 92,
        reference: { it: "Luca 2,45" },
        text: { it: "Non avendolo trovato, tornarono a Gerusalemme per cercarlo." },
      },
      {
        level: 93,
        reference: { it: "Luca 2,46" },
        text: { it: "Dopo tre giorni lo trovarono nel tempio, seduto in mezzo ai maestri, mentre li ascoltava e faceva loro domande." },
      },
      {
        level: 94,
        reference: { it: "Luca 2,47" },
        text: { it: "Tutti quelli che lo ascoltavano erano meravigliati della sua intelligenza e delle sue risposte." },
      },
      {
        level: 95,
        reference: { it: "Luca 2,48" },
        text: { it: "Quando i suoi genitori lo videro, rimasero stupiti, e sua madre gli disse: “Figlio, perché ci hai fatto questo? Tuo padre e io ti cercavamo pieni di angoscia”." },
      },
      {
        level: 96,
        reference: { it: "Luca 2,49" },
        text: { it: "Egli rispose loro: “Perché mi cercavate? Non sapevate che io devo occuparmi delle cose del Padre mio?”" },
      },
      {
        level: 97,
        reference: { it: "Luca 2,50" },
        text: { it: "Ma essi non compresero ciò che aveva detto loro." },
      },
      {
        level: 98,
        reference: { it: "Luca 2,51" },
        text: { it: "Gesù tornò con loro a Nazaret e rimase loro sottomesso. Sua madre custodiva tutte queste cose nel suo cuore." },
      },
      {
        level: 99,
        reference: { it: "Luca 2,52" },
        text: { it: "Gesù cresceva in sapienza, età e grazia davanti a Dio e agli uomini." },
      },
      {
        level: 100,
        reference: { it: "Giovanni 1,14" },
        text: { it: "E il Verbo si fece uomo e venne ad abitare in mezzo a noi; e noi abbiamo contemplato la sua gloria, gloria come quella dell'unico Figlio che viene dal Padre, pieno di grazia e di verità." },
      },
    ],
  },
  {
    stage: 6,
    levels: [
      {
        level: 101,
        reference: { it: "Luca 2,41" },
        text: { it: "I genitori di Gesù andavano ogni anno a Gerusalemme per la festa di Pasqua." },
      },
      {
        level: 102,
        reference: { it: "Luca 2,34" },
        text: { it: "Simeone li benedisse e disse a Maria, sua madre: «Egli è qui per la caduta e la risurrezione di molti in Israele, e segno di contraddizione»," },
      },
      {
        level: 103,
        reference: { it: "Luca 2,43" },
        text: { it: "Terminati i giorni della festa, mentre tornavano a casa, il ragazzo Gesù rimase a Gerusalemme senza che i suoi genitori se ne accorgessero." },
      },
      {
        level: 104,
        reference: { it: "Luca 2,35" },
        text: { it: "e una spada trafiggerà l'anima tua, affinché siano svelati i pensieri di molti cuori." },
      },
      {
        level: 105,
        reference: { it: "Luca 2,45" },
        text: { it: "Non trovandolo, tornarono a Gerusalemme per cercarlo." },
      },
      {
        level: 106,
        reference: { it: "Luca 2,36" },
        text: { it: "C'era anche una profetessa, Anna, figlia di Fanuele, della tribù di Aser, molto avanzata in età. Dopo sette anni di matrimonio aveva vissuto come vedova," },
      },
      {
        level: 107,
        reference: { it: "Luca 2,47" },
        text: { it: "Tutti quelli che lo ascoltavano rimanevano meravigliati della sua intelligenza e delle sue risposte." },
      },
      {
        level: 108,
        reference: { it: "Luca 2,48" },
        text: { it: "Quando i suoi genitori lo videro, rimasero stupiti. Sua madre gli disse: “Figlio, perché ci hai fatto questo? Tuo padre e io ti cercavamo pieni di angoscia”." },
      },
      {
        level: 109,
        reference: { it: "Luca 2,49" },
        text: { it: "Gesù rispose: “Perché mi cercavate? Non sapevate che io devo occuparmi delle cose del Padre mio?”" },
      },
      {
        level: 110,
        reference: { it: "Luca 2,37" },
        text: { it: "fino a ottantaquattro anni. Non si allontanava dal tempio, servendo Dio notte e giorno con digiuni e preghiere." },
      },
      {
        level: 111,
        reference: { it: "Luca 2,38" },
        text: { it: "In quell'istante si avvicinò e innalzò lodi a Dio, parlando del bambino a quanti aspettavano la redenzione di Gerusalemme." },
      },
      {
        level: 112,
        reference: { it: "Luca 2,26" },
        text: { it: "Gli era stato rivelato dallo Spirito Santo che non avrebbe visto la morte prima di aver visto il Cristo del Signore." },
      },
      {
        level: 113,
        reference: { it: "Giovanni 7,14" },
        text: { it: "Quando ormai la festa era a metà, Gesù salì al Tempio e cominciò a insegnare." },
      },
      {
        level: 114,
        reference: { it: "Giovanni 7,15" },
        text: { it: "I Giudei erano meravigliati e dicevano: “Come fa costui a conoscere le Scritture senza aver studiato?”" },
      },
      {
        level: 115,
        reference: { it: "Giovanni 7,16" },
        text: { it: "Gesù rispose: “Il mio insegnamento non viene da me, ma da colui che mi ha mandato”." },
      },
      {
        level: 116,
        reference: { it: "Matteo 21,23" },
        text: { it: "Gesù entrò nel Tempio e, mentre insegnava, i capi dei sacerdoti e gli anziani del popolo gli si avvicinarono e gli chiesero: “Con quale autorità fai queste cose? Chi ti ha dato questa autorità?”" },
      },
      {
        level: 117,
        reference: { it: "Matteo 26,55" },
        text: { it: "In quel momento Gesù disse alla folla: “Siete venuti a prendermi con spade e bastoni come se fossi un criminale? Ogni giorno sedevo nel Tempio a insegnare e non mi avete arrestato”." },
      },
      {
        level: 118,
        reference: { it: "Marco 12,35" },
        text: { it: "Mentre insegnava nel Tempio, Gesù domandò: “Come mai gli scribi dicono che il Cristo è figlio di Davide?”" },
      },
      {
        level: 119,
        reference: { it: "Luca 19,47" },
        text: { it: "Gesù ogni giorno insegnava nel Tempio. I capi dei sacerdoti, gli scribi e i capi del popolo cercavano di farlo morire." },
      },
      {
        level: 120,
        reference: { it: "Luca 21,37" },
        text: { it: "Durante il giorno Gesù insegnava nel Tempio; la notte usciva e trascorreva la notte sul monte chiamato degli Ulivi." },
      },
    ],
  },
  {
    stage: 7,
    levels: [
      {
        level: 121,
        reference: { it: "Matteo 3,13" },
        text: { it: "In quel tempo Gesù dalla Galilea andò al Giordano da Giovanni, per farsi battezzare da lui." },
      },
      {
        level: 122,
        reference: { it: "Matteo 3,14" },
        text: { it: "Ma Giovanni cercava di impedirglielo, dicendo: “Sono io che ho bisogno di essere battezzato da te, e tu vieni da me?”" },
      },
      {
        level: 123,
        reference: { it: "Matteo 3,15" },
        text: { it: "Gesù gli rispose: “Lascia fare per ora, perché è giusto che noi compiamo ogni cosa secondo la volontà di Dio”. Allora Giovanni accettò." },
      },
      {
        level: 124,
        reference: { it: "Matteo 3,16" },
        text: { it: "Appena fu battezzato, Gesù uscì dall'acqua. In quel momento i cieli si aprirono e vide lo Spirito di Dio scendere come una colomba e posarsi su di lui." },
      },
      {
        level: 125,
        reference: { it: "Matteo 3,17" },
        text: { it: "Ed ecco una voce dal cielo disse: “Questo è il Figlio mio, che amo; in lui ho posto il mio compiacimento”." },
      },
      {
        level: 126,
        reference: { it: "Marco 1,9" },
        text: { it: "In quei giorni Gesù venne da Nazaret di Galilea e fu battezzato da Giovanni nel Giordano." },
      },
      {
        level: 127,
        reference: { it: "Marco 1,10" },
        text: { it: "Appena Gesù uscì dall'acqua, vide i cieli aprirsi e lo Spirito scendere su di lui come una colomba." },
      },
      {
        level: 128,
        reference: { it: "Marco 1,11" },
        text: { it: "E una voce venne dal cielo: “Tu sei il Figlio mio, che amo; in te ho posto il mio compiacimento”." },
      },
      {
        level: 129,
        reference: { it: "Luca 3,21" },
        text: { it: "Quando tutto il popolo veniva battezzato, anche Gesù ricevette il battesimo. E mentre pregava, il cielo si aprì." },
      },
      {
        level: 130,
        reference: { it: "Luca 3,22" },
        text: { it: "Lo Spirito Santo scese su di lui in forma corporea, come una colomba, e dal cielo venne una voce: “Tu sei il Figlio mio, che amo; in te ho posto il mio compiacimento”." },
      },
      {
        level: 131,
        reference: { it: "Matteo 3,11" },
        text: { it: "Io vi battezzo con acqua per condurvi al pentimento, ma colui che viene dopo di me è più potente di me e io non sono degno nemmeno di portargli i sandali. Egli vi battezzerà con lo Spirito Santo e con il fuoco." },
      },
      {
        level: 132,
        reference: { it: "Matteo 3,12" },
        text: { it: "Ha in mano la pala per separare il grano dalla paglia; raccoglierà il suo grano nel granaio, ma brucerà la paglia con un fuoco che non si spegne." },
      },
      {
        level: 133,
        reference: { it: "Marco 1,7" },
        text: { it: "Giovanni annunciava: “Dopo di me viene colui che è più potente di me; io non sono degno di chinarmi per sciogliere i lacci dei suoi sandali”." },
      },
      {
        level: 134,
        reference: { it: "Marco 1,8" },
        text: { it: "Io vi ho battezzati con acqua, ma egli vi battezzerà con lo Spirito Santo." },
      },
      {
        level: 135,
        reference: { it: "Luca 3,16" },
        text: { it: "Giovanni rispose a tutti: “Io vi battezzo con acqua, ma viene colui che è più potente di me, e io non sono degno di sciogliere i lacci dei suoi sandali. Egli vi battezzerà con lo Spirito Santo e con il fuoco”." },
      },
      {
        level: 136,
        reference: { it: "Giovanni 1,29" },
        text: { it: "Il giorno dopo Giovanni vide Gesù venire verso di lui e disse: “Ecco l'Agnello di Dio, colui che toglie il peccato del mondo!”" },
      },
      {
        level: 137,
        reference: { it: "Giovanni 1,30" },
        text: { it: "Ecco colui del quale dicevo: “Dopo di me viene un uomo che è più grande di me, perché esisteva prima di me”." },
      },
      {
        level: 138,
        reference: { it: "Giovanni 1,31" },
        text: { it: "Io stesso non lo conoscevo, ma sono venuto a battezzare con acqua perché egli fosse fatto conoscere a Israele." },
      },
      {
        level: 139,
        reference: { it: "Giovanni 1,32" },
        text: { it: "Giovanni diede questa testimonianza: “Ho visto lo Spirito scendere dal cielo come una colomba e posarsi su di lui”." },
      },
      {
        level: 140,
        reference: { it: "Giovanni 1,33" },
        text: { it: "Io stesso non lo conoscevo, ma colui che mi ha mandato a battezzare con acqua mi aveva detto: “Colui sul quale vedrai scendere e rimanere lo Spirito è quello che battezza con lo Spirito Santo”." },
      },
    ],
  },
  {
    stage: 8,
    levels: [
      {
        level: 141,
        reference: { it: "Matteo 4,1" },
        text: { it: "Allora Gesù fu condotto dallo Spirito nel deserto, per essere tentato dal diavolo." },
      },
      {
        level: 142,
        reference: { it: "Matteo 4,2" },
        text: { it: "Dopo aver digiunato per quaranta giorni e quaranta notti, alla fine ebbe fame." },
      },
      {
        level: 143,
        reference: { it: "Matteo 4,3" },
        text: { it: "Il tentatore si avvicinò e gli disse: “Se tu sei il Figlio di Dio, ordina che queste pietre diventino pane”." },
      },
      {
        level: 144,
        reference: { it: "Matteo 4,4" },
        text: { it: "Ma Gesù rispose: “Sta scritto: Non di solo pane vivrà l'uomo, ma di ogni parola che viene dalla bocca di Dio”." },
      },
      {
        level: 145,
        reference: { it: "Matteo 4,5" },
        text: { it: "Allora il diavolo lo portò nella città santa, lo pose sul punto più alto del Tempio" },
      },
      {
        level: 146,
        reference: { it: "Matteo 4,6" },
        text: { it: "e gli disse: “Se tu sei il Figlio di Dio, gettati giù, perché sta scritto: Egli darà ordine ai suoi angeli di proteggerti e loro ti sosterranno con le loro mani, perché tu non abbia a urtare il piede contro una pietra”." },
      },
      {
        level: 147,
        reference: { it: "Matteo 4,7" },
        text: { it: "Gesù gli rispose: “Sta scritto anche: Non mettere alla prova il Signore, tuo Dio”." },
      },
      {
        level: 148,
        reference: { it: "Matteo 4,8" },
        text: { it: "Di nuovo il diavolo lo portò su un monte molto alto e gli mostrò tutti i regni del mondo e la loro gloria." },
      },
      {
        level: 149,
        reference: { it: "Matteo 4,9" },
        text: { it: "E gli disse: “Ti darò tutto questo, se ti inginocchierai davanti a me e mi adorerai”." },
      },
      {
        level: 150,
        reference: { it: "Matteo 4,10" },
        text: { it: "Gesù gli rispose: “Vattene, Satana! Sta scritto infatti: Adora il Signore, tuo Dio, e servi soltanto lui”." },
      },
      {
        level: 151,
        reference: { it: "Matteo 4,11" },
        text: { it: "Allora il diavolo lo lasciò, ed ecco che gli angeli si avvicinarono e si presero cura di lui." },
      },
      {
        level: 152,
        reference: { it: "Marco 1,12" },
        text: { it: "Subito dopo, lo Spirito spinse Gesù nel deserto." },
      },
      {
        level: 153,
        reference: { it: "Marco 1,13" },
        text: { it: "Nel deserto rimase quaranta giorni, tentato da Satana. Stava tra gli animali selvatici e gli angeli si prendevano cura di lui." },
      },
      {
        level: 154,
        reference: { it: "Luca 4,1" },
        text: { it: "Gesù, pieno di Spirito Santo, si allontanò dal Giordano e fu condotto dallo Spirito nel deserto." },
      },
      {
        level: 155,
        reference: { it: "Luca 4,2" },
        text: { it: "Per quaranta giorni fu tentato dal diavolo. In quei giorni non mangiò nulla e, quando terminarono, ebbe fame." },
      },
      {
        level: 156,
        reference: { it: "Luca 4,3" },
        text: { it: "Allora il diavolo gli disse: “Se tu sei il Figlio di Dio, ordina a questa pietra di diventare pane”." },
      },
      {
        level: 157,
        reference: { it: "Luca 4,4" },
        text: { it: "Gesù gli rispose: “Sta scritto: Non di solo pane vivrà l'uomo”." },
      },
      {
        level: 158,
        reference: { it: "Luca 4,5-7" },
        text: { it: "Il diavolo lo condusse in alto e gli mostrò in un istante tutti i regni della terra. Poi gli disse: “Ti darò tutto il potere e la gloria di questi regni, perché sono stati affidati a me e io li do a chi voglio. Se dunque ti inginocchierai davanti a me, tutto sarà tuo”." },
      },
      {
        level: 159,
        reference: { it: "Luca 4,8" },
        text: { it: "Gesù gli rispose: “Sta scritto: Adora il Signore, tuo Dio, e servi soltanto lui”." },
      },
      {
        level: 160,
        reference: { it: "Luca 4,9-13" },
        text: { it: "Il diavolo lo condusse a Gerusalemme, lo pose sul punto più alto del Tempio e gli disse: “Se tu sei il Figlio di Dio, gettati giù di qui; sta scritto infatti: Egli darà ordine ai suoi angeli di proteggerti e anche: Essi ti sosterranno con le loro mani, perché tu non abbia a urtare il piede contro una pietra”. Gesù gli rispose: “È stato detto: Non mettere alla prova il Signore, tuo Dio”. Dopo aver terminato ogni tentazione, il diavolo si allontanò da lui fino al momento stabilito." },
      },
    ],
  },
  {
    stage: 9,
    levels: [
      {
        level: 161,
        reference: { it: "Matteo 4,18" },
        text: { it: "Mentre camminava lungo il lago di Galilea, Gesù vide due fratelli, Simone, chiamato Pietro, e Andrea, che stavano gettando la rete nel lago, perché erano pescatori." },
      },
      {
        level: 162,
        reference: { it: "Matteo 4,19" },
        text: { it: "Gesù disse loro: “Venite dietro a me e vi farò diventare pescatori di uomini”." },
      },
      {
        level: 163,
        reference: { it: "Matteo 4,20" },
        text: { it: "Ed essi subito lasciarono le reti e lo seguirono." },
      },
      {
        level: 164,
        reference: { it: "Matteo 4,21" },
        text: { it: "Andando oltre, Gesù vide altri due fratelli, Giacomo e Giovanni, che erano nella barca con il loro padre Zebedeo e stavano sistemando le reti, e li chiamò." },
      },
      {
        level: 165,
        reference: { it: "Matteo 4,22" },
        text: { it: "Essi subito lasciarono la barca e il loro padre e seguirono Gesù." },
      },
      {
        level: 166,
        reference: { it: "Matteo 4,23" },
        text: { it: "Gesù percorreva tutta la Galilea, insegnando nelle loro sinagoghe, annunciando il Vangelo del Regno e guarendo ogni malattia e ogni infermità tra il popolo." },
      },
      {
        level: 167,
        reference: { it: "Marco 1,16" },
        text: { it: "Passando lungo il mare di Galilea, Gesù vide Simone e Andrea, fratello di Simone, mentre gettavano le reti in mare, perché erano pescatori." },
      },
      {
        level: 168,
        reference: { it: "Marco 1,17" },
        text: { it: "Gesù disse loro: “Venite dietro a me, vi farò diventare pescatori di uomini”." },
      },
      {
        level: 169,
        reference: { it: "Marco 1,18" },
        text: { it: "E subito lasciarono le reti e lo seguirono." },
      },
      {
        level: 170,
        reference: { it: "Marco 1,19-20" },
        text: { it: "Poco più avanti, Gesù vide Giacomo e Giovanni, figli di Zebedeo, nella barca mentre sistemavano le reti. Subito li chiamò ed essi lasciarono il loro padre Zebedeo nella barca con i suoi aiutanti e andarono dietro a lui." },
      },
      {
        level: 171,
        reference: { it: "Luca 6,12" },
        text: { it: "In quei giorni Gesù salì sul monte a pregare e passò tutta la notte pregando Dio." },
      },
      {
        level: 172,
        reference: { it: "Luca 6,13" },
        text: { it: "Quando fu giorno, chiamò a sé i suoi discepoli e ne scelse dodici, ai quali diede il nome di apostoli." },
      },
      {
        level: 173,
        reference: { it: "Luca 6,14-16" },
        text: { it: "Essi erano Simone, al quale diede anche il nome di Pietro, Andrea suo fratello, Giacomo, Giovanni, Filippo, Bartolomeo, Matteo, Tommaso, Giacomo figlio di Alfeo, Simone detto lo Zelota, Giuda figlio di Giacomo e Giuda Iscariota, che poi divenne il traditore." },
      },
      {
        level: 174,
        reference: { it: "Matteo 4,17" },
        text: { it: "Da quel momento Gesù cominciò a predicare e a dire: “Convertitevi, perché il Regno dei cieli è vicino”." },
      },
      {
        level: 175,
        reference: { it: "Marco 1,14" },
        text: { it: "Dopo che Giovanni fu arrestato, Gesù andò in Galilea, annunciando il Vangelo di Dio." },
      },
      {
        level: 176,
        reference: { it: "Marco 1,15" },
        text: { it: "Diceva: “Il tempo è compiuto e il Regno di Dio è vicino; convertitevi e credete nel Vangelo”." },
      },
      {
        level: 177,
        reference: { it: "Luca 4,43" },
        text: { it: "Ma Gesù disse: “Io devo annunciare la buona notizia del Regno di Dio anche alle altre città; per questo sono stato mandato”." },
      },
      {
        level: 178,
        reference: { it: "Matteo 9,35" },
        text: { it: "Gesù percorreva tutte le città e i villaggi, insegnando nelle loro sinagoghe, annunciando il Vangelo del Regno e guarendo ogni malattia e ogni infermità." },
      },
      {
        level: 179,
        reference: { it: "Matteo 10,1" },
        text: { it: "Gesù chiamò a sé i suoi dodici discepoli e diede loro il potere di scacciare gli spiriti impuri e di guarire ogni malattia e ogni infermità." },
      },
      {
        level: 180,
        reference: { it: "Matteo 10,5-7" },
        text: { it: "Gesù mandò questi dodici e diede loro queste istruzioni: “Non andate fra i pagani e non entrate nelle città dei Samaritani; rivolgetevi piuttosto alle pecore perdute della casa d'Israele. Strada facendo, annunciate che il Regno dei cieli è vicino”." },
      },
    ],
  },
  {
    stage: 10,
    levels: [
      {
        level: 181,
        reference: { it: "Matteo 8,1-3" },
        text: { it: "Quando Gesù scese dal monte, una grande folla lo seguì. Un lebbroso si avvicinò, si inginocchiò davanti a lui e disse: “Signore, se vuoi, puoi purificarmi”. Gesù stese la mano, lo toccò e disse: “Lo voglio: sii purificato!”. E subito fu guarito dalla sua lebbra." },
      },
      {
        level: 182,
        reference: { it: "Matteo 8,5-7" },
        text: { it: "Quando Gesù entrò a Cafàrnao, gli venne incontro un centurione che lo pregava dicendo: “Signore, il mio servo è a casa, paralizzato e soffre molto”. Gesù gli disse: “Verrò e lo guarirò”." },
      },
      {
        level: 183,
        reference: { it: "Matteo 8,8-10" },
        text: { it: "Il centurione rispose: “Signore, io non sono degno che tu entri nella mia casa; basta che tu dica una parola e il mio servo sarà guarito. Anch'io, infatti, sono un uomo sottoposto a un'autorità e ho dei soldati ai miei ordini”. Gesù rimase meravigliato e disse a quelli che lo seguivano: “In verità vi dico, in Israele non ho trovato nessuno con una fede così grande”." },
      },
      {
        level: 184,
        reference: { it: "Matteo 8,13" },
        text: { it: "Poi Gesù disse al centurione: “Va', e avvenga per te secondo la tua fede”. E in quella stessa ora il servo fu guarito." },
      },
      {
        level: 185,
        reference: { it: "Matteo 8,14-15" },
        text: { it: "Gesù entrò nella casa di Pietro e vide sua suocera a letto con la febbre. Le toccò la mano e la febbre scomparve. Subito lei si alzò e cominciò a servirli." },
      },
      {
        level: 186,
        reference: { it: "Matteo 8,16" },
        text: { it: "Quando venne la sera, portarono a Gesù molte persone tormentate da spiriti maligni. Egli scacciò gli spiriti con una parola e guarì tutti i malati." },
      },
      {
        level: 187,
        reference: { it: "Matteo 9,2-6" },
        text: { it: "Gli portarono un uomo paralizzato, disteso su un letto. Gesù, vedendo la loro fede, disse al paralitico: “Coraggio, figlio, ti sono perdonati i peccati”. Alcuni pensavano dentro di sé che Gesù stesse bestemmiando. Ma Gesù disse: “Perché pensate cose malvagie nei vostri cuori? Che cosa è più facile: dire ‘Ti sono perdonati i peccati’, oppure dire ‘Alzati e cammina’? Ora, perché sappiate che il Figlio dell'uomo ha il potere sulla terra di perdonare i peccati, alzati, prendi il tuo letto e va' a casa”." },
      },
      {
        level: 188,
        reference: { it: "Matteo 9,7" },
        text: { it: "L'uomo si alzò e tornò a casa. La folla, vedendo ciò, fu presa da timore e rese gloria a Dio, che aveva dato agli uomini un tale potere." },
      },
      {
        level: 189,
        reference: { it: "Matteo 9,20-22" },
        text: { it: "Una donna, che da dodici anni soffriva di perdite di sangue, si avvicinò alle spalle di Gesù e toccò il lembo del suo mantello, pensando: “Se riuscirò anche solo a toccare il suo mantello, sarò guarita”. Gesù si voltò, la vide e le disse: “Coraggio, figlia, la tua fede ti ha salvata”. Da quel momento la donna fu guarita." },
      },
      {
        level: 190,
        reference: { it: "Matteo 9,27-30" },
        text: { it: "Mentre Gesù si allontanava, due uomini ciechi lo seguirono gridando: “Figlio di Davide, abbi pietà di noi!”. Quando entrò in casa, i ciechi si avvicinarono a lui e Gesù domandò: “Credete che io possa fare questo?”. Essi risposero: “Sì, Signore”. Allora Gesù toccò i loro occhi e disse: “Avvenga per voi secondo la vostra fede”. E i loro occhi si aprirono." },
      },
      {
        level: 191,
        reference: { it: "Marco 1,29-31" },
        text: { it: "Uscito dalla sinagoga, Gesù entrò nella casa di Simone e Andrea, insieme a Giacomo e Giovanni. La suocera di Simone era a letto con la febbre e subito parlarono di lei a Gesù. Egli si avvicinò, la prese per mano e la fece alzare. La febbre scomparve e lei cominciò a servirli." },
      },
      {
        level: 192,
        reference: { it: "Marco 2,3-5" },
        text: { it: "Alcune persone arrivarono portando da Gesù un uomo paralizzato, trasportato da quattro di loro. Non riuscendo ad avvicinarsi a causa della folla, aprirono il tetto sopra il punto in cui si trovava Gesù e calarono il paralitico con il suo letto. Gesù, vedendo la loro fede, disse al paralitico: “Figlio, ti sono perdonati i peccati”." },
      },
      {
        level: 193,
        reference: { it: "Marco 2,10-12" },
        text: { it: "Gesù disse: “Perché sappiate che il Figlio dell'uomo ha il potere sulla terra di perdonare i peccati”, poi disse al paralitico: “Alzati, prendi il tuo letto e va' a casa”. L'uomo si alzò immediatamente, prese il suo letto e uscì davanti a tutti. Tutti rimasero stupiti e lodavano Dio." },
      },
      {
        level: 194,
        reference: { it: "Marco 5,25-29" },
        text: { it: "C'era una donna che da dodici anni soffriva di perdite di sangue. Aveva sofferto molto ed era stata curata da molti medici, spendendo tutto ciò che possedeva, senza ottenere alcun beneficio. Avendo sentito parlare di Gesù, si avvicinò tra la folla e toccò il suo mantello. Pensava infatti: “Se riuscirò anche solo a toccare i suoi vestiti, sarò guarita”. E subito il sangue si fermò e sentì nel corpo di essere stata guarita dalla sua malattia." },
      },
      {
        level: 195,
        reference: { it: "Marco 5,41-42" },
        text: { it: "Gesù prese la mano della ragazza e le disse: “Talità kum”, che significa: “Ragazza, io ti dico: alzati!”. Subito la ragazza si alzò e cominciò a camminare. Tutti rimasero profondamente stupiti." },
      },
      {
        level: 196,
        reference: { it: "Luca 5,17-20" },
        text: { it: "Un giorno Gesù stava insegnando e alcuni uomini portarono un paralitico su un letto. Cercavano di farlo entrare e metterlo davanti a Gesù, ma non trovando un modo a causa della folla, salirono sul tetto e lo calarono con il letto attraverso le tegole. Gesù, vedendo la loro fede, disse: “Uomo, ti sono perdonati i peccati”." },
      },
      {
        level: 197,
        reference: { it: "Luca 6,6-10" },
        text: { it: "Un altro giorno, nella sinagoga, c'era un uomo che aveva la mano destra paralizzata. Gli scribi e i farisei osservavano Gesù per vedere se lo avrebbe guarito di sabato. Gesù disse all'uomo: “Alzati e mettiti qui in mezzo”. Poi disse: “Stendi la tua mano”. Egli lo fece e la sua mano tornò completamente sana." },
      },
      {
        level: 198,
        reference: { it: "Luca 7,11-15" },
        text: { it: "Gesù si avvicinò alla città di Nain e vide che stavano portando alla sepoltura un giovane, figlio unico di una madre rimasta vedova. Vedendola, Gesù ebbe compassione di lei e le disse: “Non piangere”. Poi si avvicinò alla bara e disse: “Ragazzo, io ti dico: alzati!”. Il morto si mise seduto e cominciò a parlare, e Gesù lo consegnò a sua madre." },
      },
      {
        level: 199,
        reference: { it: "Giovanni 9,1-7" },
        text: { it: "Passando, Gesù vide un uomo cieco dalla nascita. Fece del fango con la saliva, lo mise sugli occhi dell'uomo e gli disse: “Va' a lavarti nella piscina di Sìloe”. L'uomo andò, si lavò e tornò indietro vedendo." },
      },
      {
        level: 200,
        reference: { it: "Giovanni 11,43-44" },
        text: { it: "Gesù gridò a gran voce: “Lazzaro, vieni fuori!”. Il morto uscì, con le mani e i piedi avvolti nelle bende e il volto coperto da un sudario. Gesù disse: “Liberatelo dalle bende e lasciatelo andare”." },
      },
    ],
  },
  {
    stage: 11,
    levels: [
      {
        level: 201,
        reference: { it: "Matteo 14,13" },
        text: { it: "Quando Gesù venne a sapere della morte di Giovanni Battista, partì in barca verso un luogo deserto, in disparte. Ma la folla, saputolo, lo seguì a piedi dalle città." },
      },
      {
        level: 202,
        reference: { it: "Matteo 14,14" },
        text: { it: "Quando scese dalla barca, Gesù vide una grande folla, ebbe compassione di loro e guarì i loro malati." },
      },
      {
        level: 203,
        reference: { it: "Marco 6,34" },
        text: { it: "Quando Gesù scese dalla barca, vide una grande folla e ne ebbe compassione, perché erano come pecore che non hanno pastore. E cominciò a insegnare loro molte cose." },
      },
      {
        level: 204,
        reference: { it: "Matteo 14,15" },
        text: { it: "Quando si fece sera, i discepoli si avvicinarono a Gesù e gli dissero: “Il luogo è deserto ed è ormai tardi; congeda la folla, perché possa andare nei villaggi a comprarsi da mangiare”." },
      },
      {
        level: 205,
        reference: { it: "Matteo 14,16" },
        text: { it: "Ma Gesù disse loro: “Non hanno bisogno di andare via; date loro voi stessi da mangiare”." },
      },
      {
        level: 206,
        reference: { it: "Giovanni 6,5-6" },
        text: { it: "Gesù, alzando gli occhi e vedendo che una grande folla veniva verso di lui, disse a Filippo: “Dove potremo comprare il pane perché queste persone abbiano da mangiare?”. Diceva questo per metterlo alla prova, perché sapeva già quello che stava per fare." },
      },
      {
        level: 207,
        reference: { it: "Giovanni 6,7" },
        text: { it: "Filippo gli rispose: “Duecento denari di pane non sarebbero sufficienti nemmeno per dare un piccolo pezzo a ciascuno”." },
      },
      {
        level: 208,
        reference: { it: "Giovanni 6,8-9" },
        text: { it: "Andrea, uno dei suoi discepoli, fratello di Simon Pietro, gli disse: “Qui c'è un ragazzo che ha cinque pani d'orzo e due pesci; ma che cos'è questo per tanta gente?”." },
      },
      {
        level: 209,
        reference: { it: "Matteo 14,18" },
        text: { it: "Gesù disse: “Portatemeli qui”." },
      },
      {
        level: 210,
        reference: { it: "Matteo 14,19" },
        text: { it: "Gesù ordinò alla folla di sedersi sull'erba. Poi prese i cinque pani e i due pesci, alzò gli occhi verso il cielo, pronunciò la benedizione, spezzò i pani e li diede ai discepoli, e i discepoli li distribuirono alla folla." },
      },
      {
        level: 211,
        reference: { it: "Marco 6,40" },
        text: { it: "La gente si sedette a gruppi di cento e di cinquanta." },
      },
      {
        level: 212,
        reference: { it: "Matteo 14,20" },
        text: { it: "Tutti mangiarono e furono saziati. Poi i discepoli raccolsero i pezzi avanzati e riempirono dodici ceste." },
      },
      {
        level: 213,
        reference: { it: "Matteo 14,21" },
        text: { it: "Quelli che avevano mangiato erano circa cinquemila uomini, senza contare le donne e i bambini." },
      },
      {
        level: 214,
        reference: { it: "Marco 6,35-36" },
        text: { it: "Essendo ormai tardi, i discepoli si avvicinarono a Gesù e gli dissero: “Questo luogo è deserto ed è ormai tardi. Congeda la gente, perché possa andare nelle campagne e nei villaggi vicini a comprarsi qualcosa da mangiare”." },
      },
      {
        level: 215,
        reference: { it: "Marco 6,37-38" },
        text: { it: "Gesù rispose loro: “Date loro voi stessi da mangiare”. Essi gli dissero: “Dobbiamo andare a comprare duecento denari di pane e dare loro da mangiare?”. Gesù domandò: “Quanti pani avete? Andate a vedere”. Dopo aver controllato, gli dissero: “Cinque, e due pesci”." },
      },
      {
        level: 216,
        reference: { it: "Luca 9,12-13" },
        text: { it: "Il giorno cominciava a declinare e i Dodici si avvicinarono a Gesù e gli dissero: “Congeda la folla, perché vada nei villaggi e nelle campagne vicine a trovare alloggio e cibo, perché qui siamo in un luogo deserto”. Gesù disse loro: “Date loro voi stessi da mangiare”. Essi risposero: “Non abbiamo altro che cinque pani e due pesci, a meno che non andiamo noi a comprare cibo per tutta questa gente”." },
      },
      {
        level: 217,
        reference: { it: "Luca 9,14-16" },
        text: { it: "C'erano infatti circa cinquemila uomini. Gesù disse ai discepoli: “Fateli sedere a gruppi di circa cinquanta”. Essi fecero così e li fecero sedere tutti. Poi Gesù prese i cinque pani e i due pesci, alzò gli occhi al cielo, li benedisse, li spezzò e li dava ai discepoli perché li distribuissero alla folla." },
      },
      {
        level: 218,
        reference: { it: "Giovanni 6,11" },
        text: { it: "Gesù prese dunque i pani e, dopo aver reso grazie, li distribuì a quelli che erano seduti; e fece lo stesso con i pesci, finché ne vollero." },
      },
      {
        level: 219,
        reference: { it: "Giovanni 6,12-13" },
        text: { it: "Quando furono saziati, Gesù disse ai discepoli: “Raccogliete i pezzi avanzati, perché nulla vada perduto”. Li raccolsero e riempirono dodici ceste con i pezzi dei cinque pani d'orzo avanzati a coloro che avevano mangiato." },
      },
      {
        level: 220,
        reference: { it: "Giovanni 6,14" },
        text: { it: "Allora la gente, vedendo il segno che Gesù aveva compiuto, diceva: “Questo è davvero il profeta, colui che deve venire nel mondo”." },
      },
    ],
  },
  {
    stage: 12,
    levels: [
      {
        level: 221,
        reference: { it: "Giovanni 2,1" },
        text: { it: "Tre giorni dopo ci fu uno sposalizio a Cana di Galilea e c'era la madre di Gesù." },
      },
      {
        level: 222,
        reference: { it: "Giovanni 2,2" },
        text: { it: "Anche Gesù e i suoi discepoli furono invitati allo sposalizio." },
      },
      {
        level: 223,
        reference: { it: "Giovanni 2,3" },
        text: { it: "Nel frattempo venne a mancare il vino. Allora la madre di Gesù gli disse: “Non hanno più vino”." },
      },
      {
        level: 224,
        reference: { it: "Giovanni 2,4" },
        text: { it: "Gesù le rispose: “Donna, che vuoi da me? Non è ancora giunta la mia ora”." },
      },
      {
        level: 225,
        reference: { it: "Giovanni 2,5" },
        text: { it: "Sua madre disse ai servitori: “Fate quello che vi dirà”." },
      },
      {
        level: 226,
        reference: { it: "Giovanni 2,6" },
        text: { it: "Vi erano là sei giare di pietra, destinate alle purificazioni dei Giudei, contenenti ciascuna da ottanta a centoventi litri circa." },
      },
      {
        level: 227,
        reference: { it: "Giovanni 2,7" },
        text: { it: "Gesù disse loro: “Riempite d'acqua le giare”. Ed essi le riempirono fino all'orlo." },
      },
      {
        level: 228,
        reference: { it: "Giovanni 2,8" },
        text: { it: "Poi disse loro: “Ora prendetene un po' e portatela al responsabile del banchetto”. Ed essi gliela portarono." },
      },
      {
        level: 229,
        reference: { it: "Giovanni 2,9" },
        text: { it: "Quando il responsabile del banchetto assaggiò l'acqua diventata vino, senza sapere da dove venisse, mentre lo sapevano i servitori che avevano preso l'acqua, chiamò lo sposo" },
      },
      {
        level: 230,
        reference: { it: "Giovanni 2,10" },
        text: { it: "e gli disse: “Tutti mettono in tavola il vino buono all'inizio e, quando si è bevuto molto, quello meno buono; tu invece hai tenuto da parte il vino buono fino ad ora”." },
      },
      {
        level: 231,
        reference: { it: "Giovanni 2,11" },
        text: { it: "Questo, a Cana di Galilea, fu il primo dei segni compiuti da Gesù. Egli manifestò la sua gloria e i suoi discepoli credettero in lui." },
      },
      {
        level: 232,
        reference: { it: "Giovanni 1,35" },
        text: { it: "Il giorno dopo Giovanni era di nuovo là con due dei suoi discepoli." },
      },
      {
        level: 233,
        reference: { it: "Giovanni 1,36" },
        text: { it: "Fissando lo sguardo su Gesù che passava, disse: “Ecco l'Agnello di Dio!”." },
      },
      {
        level: 234,
        reference: { it: "Giovanni 1,37" },
        text: { it: "I due discepoli, sentendolo parlare così, seguirono Gesù." },
      },
      {
        level: 235,
        reference: { it: "Giovanni 1,40" },
        text: { it: "Uno dei due che avevano ascoltato Giovanni e avevano seguito Gesù era Andrea, fratello di Simon Pietro." },
      },
      {
        level: 236,
        reference: { it: "Giovanni 1,41" },
        text: { it: "Egli incontrò per primo suo fratello Simone e gli disse: “Abbiamo trovato il Messia”, che significa Cristo." },
      },
      {
        level: 237,
        reference: { it: "Giovanni 1,42" },
        text: { it: "E lo condusse da Gesù. Gesù, fissando lo sguardo su di lui, disse: “Tu sei Simone, figlio di Giovanni; sarai chiamato Cefa”, che significa Pietro." },
      },
      {
        level: 238,
        reference: { it: "Giovanni 1,43" },
        text: { it: "Il giorno dopo Gesù volle partire per la Galilea; incontrò Filippo e gli disse: “Seguimi”." },
      },
      {
        level: 239,
        reference: { it: "Giovanni 1,45" },
        text: { it: "Filippo incontrò Natanaele e gli disse: “Abbiamo trovato colui del quale hanno scritto Mosè nella Legge e i Profeti: Gesù, figlio di Giuseppe, di Nazaret”." },
      },
      {
        level: 240,
        reference: { it: "Giovanni 2,12" },
        text: { it: "Dopo questo, Gesù scese a Cafàrnao con sua madre, i suoi fratelli e i suoi discepoli, e là rimasero alcuni giorni." },
      },
    ],
  },
  {
    stage: 13,
    levels: [
      {
        level: 241,
        reference: { it: "Matteo 14,22" },
        text: { it: "Subito dopo Gesù costrinse i discepoli a salire sulla barca e a precederlo sull'altra riva, mentre egli avrebbe congedato la folla." },
      },
      {
        level: 242,
        reference: { it: "Matteo 14,23" },
        text: { it: "Dopo aver congedato la folla, Gesù salì sul monte, in disparte, a pregare. Venuta la sera, egli era là, solo." },
      },
      {
        level: 243,
        reference: { it: "Matteo 14,24" },
        text: { it: "La barca intanto si trovava già a molti stadi dalla riva ed era agitata dalle onde, perché il vento era contrario." },
      },
      {
        level: 244,
        reference: { it: "Matteo 14,25" },
        text: { it: "Verso la fine della notte Gesù venne verso di loro camminando sul mare." },
      },
      {
        level: 245,
        reference: { it: "Matteo 14,26" },
        text: { it: "Quando i discepoli lo videro camminare sul mare, furono sconvolti e dissero: “È un fantasma!” e dalla paura gridarono." },
      },
      {
        level: 246,
        reference: { it: "Matteo 14,27" },
        text: { it: "Ma subito Gesù parlò loro dicendo: “Coraggio, sono io, non abbiate paura!”." },
      },
      {
        level: 247,
        reference: { it: "Matteo 14,28" },
        text: { it: "Pietro gli rispose: “Signore, se sei tu, comandami di venire verso di te sulle acque”." },
      },
      {
        level: 248,
        reference: { it: "Matteo 14,29" },
        text: { it: "Ed egli disse: “Vieni!”. Pietro scese dalla barca, cominciò a camminare sulle acque e andò verso Gesù." },
      },
      {
        level: 249,
        reference: { it: "Matteo 14,30" },
        text: { it: "Ma, vedendo la forza del vento, ebbe paura e, cominciando ad affondare, gridò: “Signore, salvami!”." },
      },
      {
        level: 250,
        reference: { it: "Matteo 14,31" },
        text: { it: "Subito Gesù gli tese la mano, lo afferrò e gli disse: “Uomo di poca fede, perché hai dubitato?”." },
      },
      {
        level: 251,
        reference: { it: "Matteo 14,32" },
        text: { it: "Appena salirono sulla barca, il vento cessò." },
      },
      {
        level: 252,
        reference: { it: "Matteo 14,33" },
        text: { it: "Quelli che erano sulla barca si inginocchiarono davanti a lui, dicendo: “Davvero tu sei il Figlio di Dio!”." },
      },
      {
        level: 253,
        reference: { it: "Marco 6,47" },
        text: { it: "Venuta la sera, la barca si trovava in mezzo al mare e Gesù era solo a terra." },
      },
      {
        level: 254,
        reference: { it: "Marco 6,48" },
        text: { it: "Vedendo i discepoli affaticati nel remare, perché avevano il vento contrario, verso la fine della notte Gesù venne verso di loro camminando sul mare e voleva oltrepassarli." },
      },
      {
        level: 255,
        reference: { it: "Marco 6,49-50" },
        text: { it: "Essi, vedendolo camminare sul mare, pensarono che fosse un fantasma e cominciarono a gridare, perché tutti lo avevano visto ed erano sconvolti. Ma subito Gesù parlò loro e disse: “Coraggio, sono io, non abbiate paura!”." },
      },
      {
        level: 256,
        reference: { it: "Marco 6,51" },
        text: { it: "Poi salì sulla barca con loro e il vento cessò. Ed essi erano profondamente meravigliati." },
      },
      {
        level: 257,
        reference: { it: "Giovanni 6,16" },
        text: { it: "Quando venne la sera, i discepoli scesero verso il mare." },
      },
      {
        level: 258,
        reference: { it: "Giovanni 6,17" },
        text: { it: "Salirono sulla barca e si diressero verso Cafàrnao, sull'altra riva del mare. Era ormai buio e Gesù non li aveva ancora raggiunti." },
      },
      {
        level: 259,
        reference: { it: "Giovanni 6,18-19" },
        text: { it: "Il mare era agitato, perché soffiava un forte vento. Dopo aver remato per circa cinque o sei chilometri, videro Gesù camminare sul mare e avvicinarsi alla barca, e furono presi dalla paura." },
      },
      {
        level: 260,
        reference: { it: "Giovanni 6,20-21" },
        text: { it: "Ma Gesù disse loro: “Sono io, non abbiate paura!”. Allora lo presero sulla barca e subito la barca arrivò alla riva verso la quale erano diretti." },
      },
    ],
  },
  {
    stage: 14,
    levels: [
      {
        level: 261,
        reference: { it: "Giovanni 2,13" },
        text: { it: "Era vicina la Pasqua dei Giudei e Gesù salì a Gerusalemme." },
      },
      {
        level: 262,
        reference: { it: "Giovanni 2,14" },
        text: { it: "Nel Tempio trovò venditori di buoi, pecore e colombe e i cambiavalute seduti ai loro banchi." },
      },
      {
        level: 263,
        reference: { it: "Giovanni 2,15" },
        text: { it: "Allora fece una frusta di cordicelle e scacciò tutti dal Tempio, insieme alle pecore e ai buoi; gettò a terra il denaro dei cambiavalute e rovesciò i loro banchi." },
      },
      {
        level: 264,
        reference: { it: "Giovanni 2,16" },
        text: { it: "Poi disse ai venditori di colombe: “Portate via di qui queste cose e non fate della casa del Padre mio un luogo di commercio”." },
      },
      {
        level: 265,
        reference: { it: "Giovanni 2,17" },
        text: { it: "I suoi discepoli si ricordarono che sta scritto: “Lo zelo per la tua casa mi consumerà”." },
      },
      {
        level: 266,
        reference: { it: "Matteo 21,12" },
        text: { it: "Gesù entrò nel Tempio e scacciò tutti quelli che vendevano e compravano; rovesciò i tavoli dei cambiavalute e le sedie dei venditori di colombe." },
      },
      {
        level: 267,
        reference: { it: "Matteo 21,13" },
        text: { it: "Poi disse loro: “Sta scritto: La mia casa sarà chiamata casa di preghiera, ma voi ne avete fatto un covo di ladri”." },
      },
      {
        level: 268,
        reference: { it: "Matteo 21,14" },
        text: { it: "Nel Tempio gli si avvicinarono ciechi e zoppi, e Gesù li guarì." },
      },
      {
        level: 269,
        reference: { it: "Matteo 21,15" },
        text: { it: "I capi dei sacerdoti e gli scribi, vedendo le meraviglie che aveva compiuto e i bambini che gridavano nel Tempio: “Osanna al Figlio di Davide!”, si indignarono." },
      },
      {
        level: 270,
        reference: { it: "Matteo 21,16" },
        text: { it: "Gli dissero: “Non senti quello che stanno dicendo?”. Gesù rispose loro: “Sì. Non avete mai letto: Dalla bocca dei bambini e dei neonati hai preparato una lode?”." },
      },
      {
        level: 271,
        reference: { it: "Matteo 21,17" },
        text: { it: "Li lasciò e uscì fuori dalla città, verso Betania, dove trascorse la notte." },
      },
      {
        level: 272,
        reference: { it: "Marco 11,15" },
        text: { it: "Giunsero a Gerusalemme. Entrato nel Tempio, Gesù cominciò a scacciare quelli che vendevano e compravano nel Tempio; rovesciò i tavoli dei cambiavalute e le sedie dei venditori di colombe." },
      },
      {
        level: 273,
        reference: { it: "Marco 11,16" },
        text: { it: "E non permetteva che si trasportassero oggetti attraverso il Tempio." },
      },
      {
        level: 274,
        reference: { it: "Marco 11,17" },
        text: { it: "Poi insegnava loro dicendo: “Non sta forse scritto: La mia casa sarà chiamata casa di preghiera per tutte le nazioni? Voi invece ne avete fatto un covo di ladri”." },
      },
      {
        level: 275,
        reference: { it: "Marco 11,18" },
        text: { it: "I capi dei sacerdoti e gli scribi lo vennero a sapere e cercavano il modo di farlo morire, perché avevano paura di lui, poiché tutta la folla era meravigliata del suo insegnamento." },
      },
      {
        level: 276,
        reference: { it: "Luca 19,45" },
        text: { it: "Gesù entrò nel Tempio e cominciò a scacciare quelli che vendevano." },
      },
      {
        level: 277,
        reference: { it: "Luca 19,46" },
        text: { it: "E disse loro: “Sta scritto: La mia casa sarà casa di preghiera. Voi invece ne avete fatto un covo di ladri”." },
      },
      {
        level: 278,
        reference: { it: "Luca 19,47" },
        text: { it: "Ogni giorno Gesù insegnava nel Tempio. Intanto i capi dei sacerdoti, gli scribi e i capi del popolo cercavano di farlo morire." },
      },
      {
        level: 279,
        reference: { it: "Luca 19,48" },
        text: { it: "Ma non trovavano il modo di farlo, perché tutto il popolo pendeva dalle sue labbra e lo ascoltava." },
      },
      {
        level: 280,
        reference: { it: "Giovanni 2,18-19" },
        text: { it: "Allora i Giudei gli chiesero: “Quale segno ci mostri per fare queste cose?”. Gesù rispose loro: “Distruggete questo Tempio e in tre giorni lo farò risorgere”." },
      },
    ],
  },
  {
    stage: 15,
    levels: [
      {
        level: 281,
        reference: { it: "Matteo 21,1" },
        text: { it: "Quando furono vicini a Gerusalemme e arrivarono a Betfage, sul monte degli Ulivi, Gesù mandò due discepoli" },
      },
      {
        level: 282,
        reference: { it: "Matteo 21,2" },
        text: { it: "dicendo loro: “Andate nel villaggio di fronte a voi. Subito troverete un'asina legata e con essa un puledro. Slegateli e conduceteli da me”." },
      },
      {
        level: 283,
        reference: { it: "Matteo 21,3" },
        text: { it: "E se qualcuno vi dirà qualcosa, rispondete: “Il Signore ne ha bisogno, ma li rimanderà subito”." },
      },
      {
        level: 284,
        reference: { it: "Matteo 21,4-5" },
        text: { it: "Questo avvenne perché si compisse ciò che era stato detto dal profeta: “Dite alla figlia di Sion: Ecco, il tuo re viene a te, mite, seduto su un'asina e su un puledro, figlio di una bestia da soma”." },
      },
      {
        level: 285,
        reference: { it: "Matteo 21,6" },
        text: { it: "I discepoli andarono e fecero quello che Gesù aveva ordinato loro." },
      },
      {
        level: 286,
        reference: { it: "Matteo 21,7" },
        text: { it: "Condussero l'asina e il puledro, misero su di essi i loro mantelli e Gesù vi si pose a sedere." },
      },
      {
        level: 287,
        reference: { it: "Matteo 21,8" },
        text: { it: "La folla, numerosissima, stese i propri mantelli sulla strada, mentre altri tagliavano rami dagli alberi e li stendevano lungo il cammino." },
      },
      {
        level: 288,
        reference: { it: "Matteo 21,9" },
        text: { it: "Le folle che lo precedevano e quelle che lo seguivano gridavano: “Osanna al Figlio di Davide! Benedetto colui che viene nel nome del Signore! Osanna nel più alto dei cieli!”." },
      },
      {
        level: 289,
        reference: { it: "Marco 11,7" },
        text: { it: "Condussero a Gesù il puledro, vi gettarono sopra i loro mantelli ed egli vi salì sopra." },
      },
      {
        level: 290,
        reference: { it: "Marco 11,8" },
        text: { it: "Molti stendevano i propri mantelli sulla strada, altri invece mettevano rami verdi, tagliati nei campi." },
      },
      {
        level: 291,
        reference: { it: "Marco 11,9" },
        text: { it: "Quelli che precedevano Gesù e quelli che lo seguivano gridavano: “Osanna! Benedetto colui che viene nel nome del Signore!”." },
      },
      {
        level: 292,
        reference: { it: "Marco 11,10" },
        text: { it: "“Benedetto il Regno che viene, il regno del nostro padre Davide! Osanna nel più alto dei cieli!”." },
      },
      {
        level: 293,
        reference: { it: "Luca 19,35" },
        text: { it: "Poi condussero il puledro da Gesù, vi gettarono sopra i loro mantelli e fecero salire Gesù." },
      },
      {
        level: 294,
        reference: { it: "Luca 19,36" },
        text: { it: "Mentre Gesù avanzava, stendevano i loro mantelli sulla strada." },
      },
      {
        level: 295,
        reference: { it: "Luca 19,37" },
        text: { it: "Quando fu vicino alla discesa del monte degli Ulivi, tutta la folla dei discepoli, piena di gioia, cominciò a lodare Dio a gran voce per tutti i miracoli che aveva visto." },
      },
      {
        level: 296,
        reference: { it: "Luca 19,38" },
        text: { it: "Gridavano: “Benedetto colui che viene, il re, nel nome del Signore! Pace in cielo e gloria nel più alto dei cieli!”." },
      },
      {
        level: 297,
        reference: { it: "Luca 19,39" },
        text: { it: "Alcuni farisei tra la folla gli dissero: “Maestro, rimprovera i tuoi discepoli!”." },
      },
      {
        level: 298,
        reference: { it: "Luca 19,40" },
        text: { it: "Ma Gesù rispose: “Io vi dico che, se questi tacessero, griderebbero le pietre”." },
      },
      {
        level: 299,
        reference: { it: "Giovanni 12,14-15" },
        text: { it: "Gesù trovò un asinello e vi salì sopra, come sta scritto: “Non temere, figlia di Sion! Ecco, il tuo re viene, seduto sopra un puledro d'asina”." },
      },
      {
        level: 300,
        reference: { it: "Giovanni 12,16" },
        text: { it: "I suoi discepoli al momento non compresero queste cose; ma quando Gesù fu glorificato, si ricordarono che questo era stato scritto su di lui e che questo avevano fatto per lui." },
      },
    ],
  },
  {
    stage: 16,
    levels: [
      {
        level: 301,
        reference: { it: "Matteo 26,14-16" },
        text: { it: "Allora uno dei Dodici, chiamato Giuda Iscariota, andò dai capi dei sacerdoti e disse: “Quanto volete darmi perché io ve lo consegni?”. Ed essi gli offrirono trenta monete d'argento. Da quel momento Giuda cercava l'occasione giusta per consegnarlo." },
      },
      {
        level: 302,
        reference: { it: "Matteo 26,20-21" },
        text: { it: "Venuta la sera, Gesù si mise a tavola con i Dodici. Mentre mangiavano, disse: “In verità vi dico: uno di voi mi tradirà”." },
      },
      {
        level: 303,
        reference: { it: "Matteo 26,22" },
        text: { it: "I discepoli, profondamente rattristati, cominciarono a chiedergli uno dopo l'altro: “Sono forse io, Signore?”." },
      },
      {
        level: 304,
        reference: { it: "Matteo 26,23-24" },
        text: { it: "Gesù rispose: “Colui che mette con me la mano nel piatto, è quello che mi tradirà. Il Figlio dell'uomo se ne va, come è stato scritto di lui, ma guai a quell'uomo dal quale il Figlio dell'uomo viene tradito! Sarebbe stato meglio per quell'uomo se non fosse mai nato”." },
      },
      {
        level: 305,
        reference: { it: "Matteo 26,25" },
        text: { it: "Giuda, il traditore, disse: “Maestro, sono forse io?”. Gesù gli rispose: “Tu l'hai detto”." },
      },
      {
        level: 306,
        reference: { it: "Matteo 26,47" },
        text: { it: "Mentre Gesù stava ancora parlando, arrivò Giuda, uno dei Dodici, insieme a una grande folla armata di spade e bastoni, mandata dai capi dei sacerdoti e dagli anziani del popolo." },
      },
      {
        level: 307,
        reference: { it: "Matteo 26,48" },
        text: { it: "Il traditore aveva dato loro questo segno: “Quello che bacerò è lui; arrestatelo”." },
      },
      {
        level: 308,
        reference: { it: "Matteo 26,49" },
        text: { it: "Subito Giuda si avvicinò a Gesù e disse: “Salve, Maestro!”. E lo baciò." },
      },
      {
        level: 309,
        reference: { it: "Matteo 26,50" },
        text: { it: "Gesù gli disse: “Amico, per questo sei qui?”. Allora quelli si avvicinarono, misero le mani addosso a Gesù e lo arrestarono." },
      },
      {
        level: 310,
        reference: { it: "Matteo 26,51" },
        text: { it: "Ed ecco, uno di quelli che erano con Gesù mise mano alla spada, la estrasse e colpì il servo del sommo sacerdote, staccandogli un orecchio." },
      },
      {
        level: 311,
        reference: { it: "Matteo 26,52-54" },
        text: { it: "Gesù gli disse: “Rimetti la spada al suo posto, perché tutti quelli che prendono la spada moriranno di spada. Pensi forse che io non possa pregare il Padre mio, che mi metterebbe subito a disposizione più di dodici legioni di angeli? Ma allora come si compirebbero le Scritture, secondo le quali deve avvenire così?”." },
      },
      {
        level: 312,
        reference: { it: "Marco 14,43" },
        text: { it: "Mentre Gesù stava ancora parlando, arrivò Giuda, uno dei Dodici, accompagnato da una folla armata di spade e bastoni, mandata dai capi dei sacerdoti, dagli scribi e dagli anziani." },
      },
      {
        level: 313,
        reference: { it: "Marco 14,44-45" },
        text: { it: "Il traditore aveva dato loro un segno: “Quello che bacerò è lui; arrestatelo e portatelo via sotto buona scorta”. Appena arrivato, Giuda si avvicinò a Gesù e disse: “Maestro!”, e lo baciò." },
      },
      {
        level: 314,
        reference: { it: "Marco 14,46" },
        text: { it: "Allora gli uomini misero le mani addosso a Gesù e lo arrestarono." },
      },
      {
        level: 315,
        reference: { it: "Luca 22,47-48" },
        text: { it: "Mentre Gesù stava ancora parlando, arrivò una folla. Davanti a tutti c'era Giuda, uno dei Dodici. Si avvicinò a Gesù per baciarlo. Ma Gesù gli disse: “Giuda, con un bacio tu tradisci il Figlio dell'uomo?”." },
      },
      {
        level: 316,
        reference: { it: "Luca 22,49-50" },
        text: { it: "Quelli che erano con Gesù, vedendo ciò che stava per accadere, dissero: “Signore, dobbiamo colpire con la spada?”. E uno di loro colpì il servo del sommo sacerdote e gli staccò l'orecchio destro." },
      },
      {
        level: 317,
        reference: { it: "Luca 22,51" },
        text: { it: "Ma Gesù intervenne dicendo: “Lasciate, basta così!”. Poi toccò l'orecchio dell'uomo e lo guarì." },
      },
      {
        level: 318,
        reference: { it: "Luca 22,52-53" },
        text: { it: "Poi Gesù disse ai capi dei sacerdoti, alle guardie del Tempio e agli anziani che erano venuti contro di lui: “Siete venuti con spade e bastoni come contro un bandito. Ogni giorno ero con voi nel Tempio e non avete mai messo le mani su di me. Ma questa è la vostra ora, è il momento in cui domina il potere delle tenebre”." },
      },
      {
        level: 319,
        reference: { it: "Giovanni 18,3-6" },
        text: { it: "Giuda arrivò là con un gruppo di soldati e alcune guardie mandate dai capi dei sacerdoti e dai farisei, con lanterne, torce e armi. Gesù, sapendo tutto quello che stava per accadergli, uscì e domandò loro: “Chi cercate?”. Gli risposero: “Gesù il Nazareno”. Gesù disse: “Sono io”. Appena disse loro “Sono io”, indietreggiarono e caddero a terra." },
      },
      {
        level: 320,
        reference: { it: "Giovanni 18,7-9" },
        text: { it: "Gesù domandò di nuovo: “Chi cercate?”. Essi risposero: “Gesù il Nazareno”. Gesù disse: “Vi ho detto che sono io. Se dunque cercate me, lasciate che questi se ne vadano”. Così si compiva la parola che aveva pronunciato: “Non ho perduto nessuno di quelli che mi hai dato”." },
      },
    ],
  },
  {
    stage: 17,
    levels: [
      {
        level: 321,
        reference: { it: "Matteo 27,11" },
        text: { it: "Gesù comparve davanti al governatore. Il governatore lo interrogò dicendo: “Sei tu il re dei Giudei?”. Gesù rispose: “Tu lo dici”." },
      },
      {
        level: 322,
        reference: { it: "Matteo 27,12" },
        text: { it: "Mentre veniva accusato dai capi dei sacerdoti e dagli anziani, Gesù non rispondeva nulla." },
      },
      {
        level: 323,
        reference: { it: "Matteo 27,13-14" },
        text: { it: "Allora Pilato gli disse: “Non senti quante cose testimoniano contro di te?”. Ma Gesù non rispose nemmeno una parola, tanto che il governatore rimase molto sorpreso." },
      },
      {
        level: 324,
        reference: { it: "Matteo 27,15-17" },
        text: { it: "A ogni festa il governatore era solito mettere in libertà per la folla un prigioniero, quello che avessero scelto. In quel momento avevano un prigioniero famoso, chiamato Barabba. Quando dunque si erano riuniti, Pilato disse loro: “Chi volete che vi metta in libertà: Barabba o Gesù, chiamato Cristo?”." },
      },
      {
        level: 325,
        reference: { it: "Matteo 27,18" },
        text: { it: "Pilato infatti sapeva bene che glielo avevano consegnato per invidia." },
      },
      {
        level: 326,
        reference: { it: "Matteo 27,19" },
        text: { it: "Mentre Pilato sedeva in tribunale, sua moglie gli mandò a dire: “Non avere nulla a che fare con quel giusto, perché oggi, in sogno, ho sofferto molto per causa sua”." },
      },
      {
        level: 327,
        reference: { it: "Matteo 27,20" },
        text: { it: "Ma i capi dei sacerdoti e gli anziani convinsero la folla a chiedere la liberazione di Barabba e la condanna di Gesù." },
      },
      {
        level: 328,
        reference: { it: "Matteo 27,21-22" },
        text: { it: "Il governatore domandò loro: “Chi dei due volete che io vi metta in libertà?”. Essi risposero: “Barabba!”. Pilato disse loro: “Che cosa farò dunque di Gesù, chiamato Cristo?”. Tutti risposero: “Sia crocifisso!”." },
      },
      {
        level: 329,
        reference: { it: "Matteo 27,23" },
        text: { it: "Pilato domandò: “Ma che male ha fatto?”. Essi però gridavano ancora più forte: “Sia crocifisso!”." },
      },
      {
        level: 330,
        reference: { it: "Matteo 27,24" },
        text: { it: "Pilato, vedendo che non otteneva nulla e che anzi la folla diventava sempre più agitata, prese dell'acqua, si lavò le mani davanti alla folla e disse: “Io non sono responsabile del sangue di quest'uomo. Pensateci voi!”." },
      },
      {
        level: 331,
        reference: { it: "Matteo 27,25" },
        text: { it: "Tutto il popolo rispose: “Il suo sangue ricada su di noi e sui nostri figli”." },
      },
      {
        level: 332,
        reference: { it: "Matteo 27,26" },
        text: { it: "Allora Pilato mise in libertà Barabba e, dopo aver fatto flagellare Gesù, lo consegnò perché fosse crocifisso." },
      },
      {
        level: 333,
        reference: { it: "Marco 15,12-14" },
        text: { it: "Pilato riprese a parlare alla folla: “Che cosa volete dunque che io faccia di colui che chiamate il re dei Giudei?”. Ed essi gridarono di nuovo: “Crocifiggilo!”. Pilato disse loro: “Che male ha fatto?”. Ma essi gridarono ancora più forte: “Crocifiggilo!”." },
      },
      {
        level: 334,
        reference: { it: "Marco 15,15" },
        text: { it: "Pilato, volendo dare soddisfazione alla folla, mise in libertà Barabba e, dopo aver fatto flagellare Gesù, lo consegnò perché fosse crocifisso." },
      },
      {
        level: 335,
        reference: { it: "Luca 23,13-16" },
        text: { it: "Pilato, riuniti i capi dei sacerdoti, le autorità e il popolo, disse loro: “Mi avete portato quest'uomo come se fosse un agitatore del popolo. Ebbene, io l'ho esaminato davanti a voi e non ho trovato in lui nessuna delle colpe di cui lo accusate. E nemmeno Erode le ha trovate, infatti ce lo ha rimandato. Ecco, egli non ha fatto nulla che meriti la morte. Perciò, dopo averlo punito, lo metterò in libertà”." },
      },
      {
        level: 336,
        reference: { it: "Luca 23,20-21" },
        text: { it: "Pilato parlò loro di nuovo, perché voleva mettere in libertà Gesù. Ma essi gridavano: “Crocifiggilo! Crocifiggilo!”." },
      },
      {
        level: 337,
        reference: { it: "Giovanni 18,38-39" },
        text: { it: "Pilato gli disse: “Che cos'è la verità?”. E, detto questo, uscì di nuovo verso i Giudei e disse loro: “Io non trovo in lui nessuna colpa. Voi avete l'abitudine che, per la Pasqua, io vi metta in libertà uno. Volete dunque che io vi metta in libertà il re dei Giudei?”." },
      },
      {
        level: 338,
        reference: { it: "Giovanni 19,4-6" },
        text: { it: "Pilato uscì di nuovo e disse loro: “Ecco, io ve lo conduco fuori, perché sappiate che non trovo in lui nessuna colpa”. Allora Gesù uscì, portando la corona di spine e il mantello di porpora. Pilato disse loro: “Ecco l'uomo!”. Quando lo videro, i capi dei sacerdoti e le guardie gridarono: “Crocifiggilo! Crocifiggilo!”. Pilato disse loro: “Prendetelo voi e crocifiggetelo; io non trovo in lui nessuna colpa”." },
      },
      {
        level: 339,
        reference: { it: "Giovanni 19,10-11" },
        text: { it: "Pilato gli disse: “Non vuoi parlare con me? Non sai che ho il potere di metterti in libertà e il potere di crocifiggerti?”. Gesù gli rispose: “Tu non avresti alcun potere su di me, se non ti fosse stato dato dall'alto”." },
      },
      {
        level: 340,
        reference: { it: "Giovanni 19,12-16" },
        text: { it: "Da quel momento Pilato cercava di metterlo in libertà. Ma i Giudei gridavano: “Se metti in libertà costui, non sei amico di Cesare! Chiunque si fa re si mette contro Cesare”. Pilato, allora, consegnò Gesù nelle loro mani perché fosse crocifisso. Essi presero Gesù e lo condussero via." },
      },
    ],
  },
  {
    stage: 18,
    levels: [
      {
        level: 341,
        reference: { it: "Matteo 27,27-28" },
        text: { it: "I soldati del governatore portarono Gesù nel palazzo del governatore e radunarono intorno a lui tutta la truppa. Lo spogliarono, gli misero addosso un mantello scarlatto" },
      },
      {
        level: 342,
        reference: { it: "Matteo 27,29" },
        text: { it: "intrecciarono una corona di spine, gliela misero sul capo e gli misero una canna nella mano destra. Poi, inginocchiandosi davanti a lui, lo deridevano dicendo: “Salve, re dei Giudei!”." },
      },
      {
        level: 343,
        reference: { it: "Matteo 27,30" },
        text: { it: "Gli sputavano addosso, gli prendevano la canna e lo colpivano sulla testa." },
      },
      {
        level: 344,
        reference: { it: "Matteo 27,31" },
        text: { it: "Dopo averlo deriso, gli tolsero il mantello, gli rimisero i suoi vestiti e lo portarono via per crocifiggerlo." },
      },
      {
        level: 345,
        reference: { it: "Matteo 27,32" },
        text: { it: "Mentre uscivano, incontrarono un uomo di Cirene, chiamato Simone, e lo costrinsero a portare la croce di Gesù." },
      },
      {
        level: 346,
        reference: { it: "Matteo 27,33-34" },
        text: { it: "Giunti al luogo chiamato Golgota, che significa “Luogo del Cranio”, gli diedero da bere vino mescolato con una sostanza amara. Gesù lo assaggiò, ma non volle berne." },
      },
      {
        level: 347,
        reference: { it: "Matteo 27,35" },
        text: { it: "Dopo averlo crocifisso, si divisero i suoi vestiti tirandoli a sorte." },
      },
      {
        level: 348,
        reference: { it: "Matteo 27,36" },
        text: { it: "Poi si sedettero lì e rimasero a sorvegliarlo." },
      },
      {
        level: 349,
        reference: { it: "Matteo 27,37" },
        text: { it: "Sopra la sua testa avevano posto il motivo della sua condanna: “Questo è Gesù, il re dei Giudei”." },
      },
      {
        level: 350,
        reference: { it: "Matteo 27,38" },
        text: { it: "Insieme a lui furono crocifissi due ladroni, uno a destra e uno a sinistra." },
      },
      {
        level: 351,
        reference: { it: "Marco 15,33-34" },
        text: { it: "A mezzogiorno si fece buio su tutta la terra fino alle tre del pomeriggio. Alle tre Gesù gridò a gran voce: “Eloì, Eloì, lemà sabactàni?”, che significa: “Dio mio, Dio mio, perché mi hai abbandonato?”." },
      },
      {
        level: 352,
        reference: { it: "Luca 23,33-34" },
        text: { it: "Quando arrivarono al luogo chiamato Cranio, vi crocifissero Gesù e i due malfattori, uno a destra e l'altro a sinistra. Gesù diceva: “Padre, perdona loro, perché non sanno quello che fanno”. Poi si divisero i suoi vestiti, tirandoli a sorte." },
      },
      {
        level: 353,
        reference: { it: "Luca 23,39-43" },
        text: { it: "Uno dei malfattori appesi alla croce lo insultava. L'altro invece lo rimproverava dicendo: “Non hai paura di Dio? Noi riceviamo ciò che abbiamo meritato per le nostre azioni, ma lui non ha fatto nulla di male”. Poi disse: “Gesù, ricordati di me quando entrerai nel tuo regno”. Gesù gli rispose: “In verità ti dico: oggi sarai con me in paradiso”." },
      },
      {
        level: 354,
        reference: { it: "Giovanni 19,25" },
        text: { it: "Vicino alla croce di Gesù stavano sua madre, la sorella di sua madre, Maria moglie di Clèopa, e Maria di Magdala." },
      },
      {
        level: 355,
        reference: { it: "Giovanni 19,26-27" },
        text: { it: "Gesù, vedendo sua madre e accanto a lei il discepolo che amava, disse a sua madre: “Donna, ecco tuo figlio!”. Poi disse al discepolo: “Ecco tua madre!”. E da quel momento il discepolo la prese nella sua casa." },
      },
      {
        level: 356,
        reference: { it: "Giovanni 19,28-29" },
        text: { it: "Dopo questo, Gesù, sapendo che ormai tutto era compiuto, disse, perché si compisse la Scrittura: “Ho sete”. C'era lì un recipiente pieno di aceto; misero quindi una spugna imbevuta di aceto su una canna e gliela accostarono alla bocca." },
      },
      {
        level: 357,
        reference: { it: "Giovanni 19,30" },
        text: { it: "Dopo aver preso l'aceto, Gesù disse: “È compiuto!”. Poi chinò il capo e consegnò lo spirito." },
      },
      {
        level: 358,
        reference: { it: "Matteo 27,50-51" },
        text: { it: "Ma Gesù, dopo aver gridato di nuovo a gran voce, emise lo spirito. Ed ecco, il velo del Tempio si squarciò in due, dall'alto fino in fondo; la terra tremò e le rocce si spezzarono." },
      },
      {
        level: 359,
        reference: { it: "Marco 15,39" },
        text: { it: "Il centurione, che si trovava di fronte a Gesù, vedendolo morire in quel modo, disse: “Davvero quest'uomo era Figlio di Dio!”." },
      },
      {
        level: 360,
        reference: { it: "Giovanni 19,33-34" },
        text: { it: "Venuti da Gesù, i soldati videro che era già morto e non gli spezzarono le gambe. Ma uno dei soldati gli colpì il fianco con la lancia e subito ne uscì sangue e acqua." },
      },
    ],
  },
  {
    stage: 19,
    levels: [
      {
        level: 361,
        reference: { it: "Matteo 28,1" },
        text: { it: "Dopo il sabato, all'alba del primo giorno della settimana, Maria di Magdala e l'altra Maria andarono a visitare il sepolcro." },
      },
      {
        level: 362,
        reference: { it: "Matteo 28,2" },
        text: { it: "Ed ecco, vi fu un grande terremoto. Un angelo del Signore scese dal cielo, si avvicinò, rotolò via la pietra e si sedette sopra di essa." },
      },
      {
        level: 363,
        reference: { it: "Matteo 28,3" },
        text: { it: "Il suo aspetto era come la luce di un lampo e il suo vestito era bianco come la neve." },
      },
      {
        level: 364,
        reference: { it: "Matteo 28,4" },
        text: { it: "Per la paura che ebbero di lui, le guardie tremarono e rimasero come morte." },
      },
      {
        level: 365,
        reference: { it: "Matteo 28,5-6" },
        text: { it: "L'angelo disse alle donne: “Non abbiate paura! So che cercate Gesù, il crocifisso. Non è qui, è risorto, proprio come aveva detto. Venite a vedere il luogo dove era stato deposto”." },
      },
      {
        level: 366,
        reference: { it: "Matteo 28,7" },
        text: { it: "Poi disse loro: “Andate subito a dire ai suoi discepoli: È risorto dai morti e ora vi precede in Galilea; là lo vedrete. Ecco, io ve l'ho detto”." },
      },
      {
        level: 367,
        reference: { it: "Marco 16,1" },
        text: { it: "Passato il sabato, Maria di Magdala, Maria madre di Giacomo e Salome comprarono oli profumati per andare a ungere Gesù." },
      },
      {
        level: 368,
        reference: { it: "Marco 16,2-3" },
        text: { it: "Di buon mattino, il primo giorno della settimana, vennero al sepolcro al sorgere del sole. Dicevano tra loro: “Chi ci farà rotolare via la pietra dall'ingresso del sepolcro?”." },
      },
      {
        level: 369,
        reference: { it: "Marco 16,4" },
        text: { it: "Alzando gli occhi, videro che la pietra era già stata fatta rotolare via; era infatti molto grande." },
      },
      {
        level: 370,
        reference: { it: "Marco 16,5-6" },
        text: { it: "Entrate nel sepolcro, videro un giovane seduto sulla destra, vestito di una veste bianca, e furono spaventate. Ma egli disse loro: “Non abbiate paura! Voi cercate Gesù il Nazareno, il crocifisso. È risorto, non è qui. Ecco il luogo dove lo avevano deposto”." },
      },
      {
        level: 371,
        reference: { it: "Marco 16,7" },
        text: { it: "Ora andate, dite ai suoi discepoli e a Pietro: “Egli vi precede in Galilea. Là lo vedrete, come vi ha detto”." },
      },
      {
        level: 372,
        reference: { it: "Luca 24,1" },
        text: { it: "Il primo giorno della settimana, al mattino presto, le donne andarono al sepolcro portando gli aromi che avevano preparato." },
      },
      {
        level: 373,
        reference: { it: "Luca 24,2-3" },
        text: { it: "Trovarono che la pietra era stata tolta dal sepolcro. Entrate, non trovarono il corpo del Signore Gesù." },
      },
      {
        level: 374,
        reference: { it: "Luca 24,4-5" },
        text: { it: "Mentre erano ancora confuse per questo fatto, ecco apparire accanto a loro due uomini con vesti splendenti. Le donne, impaurite, tenevano il volto rivolto verso terra, ma quelli dissero loro: “Perché cercate tra i morti colui che è vivo?”." },
      },
      {
        level: 375,
        reference: { it: "Luca 24,6-7" },
        text: { it: "“Non è qui, è risorto. Ricordatevi di come vi parlò quando era ancora in Galilea, dicendo: Il Figlio dell'uomo deve essere consegnato nelle mani dei peccatori, essere crocifisso e risorgere il terzo giorno”." },
      },
      {
        level: 376,
        reference: { it: "Luca 24,8-9" },
        text: { it: "Ed esse si ricordarono delle sue parole e, tornate dal sepolcro, annunciarono tutto questo agli Undici e a tutti gli altri." },
      },
      {
        level: 377,
        reference: { it: "Giovanni 20,1" },
        text: { it: "Il primo giorno della settimana, Maria di Magdala si recò al sepolcro di buon mattino, quando era ancora buio, e vide che la pietra era stata tolta dal sepolcro." },
      },
      {
        level: 378,
        reference: { it: "Giovanni 20,2" },
        text: { it: "Corse allora da Simon Pietro e dall'altro discepolo, quello che Gesù amava, e disse loro: “Hanno portato via il Signore dal sepolcro e non sappiamo dove l'hanno messo!”." },
      },
      {
        level: 379,
        reference: { it: "Giovanni 20,3-8" },
        text: { it: "Pietro allora uscì insieme all'altro discepolo e andarono al sepolcro. Correvano insieme, ma l'altro discepolo arrivò per primo. Si chinò, vide i teli posati là, ma non entrò. Arrivò intanto anche Simon Pietro, entrò nel sepolcro e vide i teli posati là, e il sudario che era stato sul capo di Gesù, non insieme ai teli, ma piegato in un luogo a parte. Allora entrò anche l'altro discepolo, vide e credette." },
      },
      {
        level: 380,
        reference: { it: "Giovanni 20,9-10" },
        text: { it: "Infatti non avevano ancora compreso la Scrittura, secondo la quale Gesù doveva risorgere dai morti. Poi i discepoli tornarono di nuovo a casa." },
      },
    ],
  },
  {
    stage: 20,
    levels: [
      {
        level: 381,
        reference: { it: "Giovanni 20,19" },
        text: { it: "La sera di quello stesso giorno, il primo della settimana, mentre i discepoli si trovavano insieme con le porte chiuse per paura dei capi dei Giudei, Gesù venne, si fermò in mezzo a loro e disse: “Pace a voi!”." },
      },
      {
        level: 382,
        reference: { it: "Giovanni 20,20" },
        text: { it: "Detto questo, mostrò loro le mani e il fianco. I discepoli furono pieni di gioia nel vedere il Signore." },
      },
      {
        level: 383,
        reference: { it: "Giovanni 20,21" },
        text: { it: "Gesù disse loro di nuovo: “Pace a voi! Come il Padre ha mandato me, anch'io mando voi”." },
      },
      {
        level: 384,
        reference: { it: "Giovanni 20,22" },
        text: { it: "Detto questo, soffiò su di loro e disse: “Ricevete lo Spirito Santo”." },
      },
      {
        level: 385,
        reference: { it: "Giovanni 20,23" },
        text: { it: "“A coloro a cui perdonerete i peccati, saranno perdonati; a coloro a cui non li perdonerete, non saranno perdonati”." },
      },
      {
        level: 386,
        reference: { it: "Giovanni 20,24" },
        text: { it: "Tommaso, uno dei Dodici, chiamato Didimo, non era con loro quando venne Gesù." },
      },
      {
        level: 387,
        reference: { it: "Giovanni 20,25" },
        text: { it: "Gli altri discepoli gli dicevano: “Abbiamo visto il Signore!”. Ma egli rispose: “Se non vedo nelle sue mani il segno dei chiodi e non metto il mio dito nel segno dei chiodi e la mia mano nel suo fianco, io non credo”." },
      },
      {
        level: 388,
        reference: { it: "Giovanni 20,26" },
        text: { it: "Otto giorni dopo, i discepoli erano di nuovo in casa e c'era con loro anche Tommaso. Gesù venne, a porte chiuse, si fermò in mezzo a loro e disse: “Pace a voi!”." },
      },
      {
        level: 389,
        reference: { it: "Giovanni 20,27" },
        text: { it: "Poi disse a Tommaso: “Metti qui il tuo dito e guarda le mie mani; allunga la tua mano e mettila nel mio fianco. E non essere più incredulo, ma credente”." },
      },
      {
        level: 390,
        reference: { it: "Giovanni 20,28" },
        text: { it: "Tommaso gli rispose: “Mio Signore e mio Dio!”." },
      },
      {
        level: 391,
        reference: { it: "Giovanni 20,29" },
        text: { it: "Gesù gli disse: “Perché mi hai veduto, hai creduto; beati quelli che non hanno visto e hanno creduto”." },
      },
      {
        level: 392,
        reference: { it: "Matteo 28,16" },
        text: { it: "Gli undici discepoli andarono in Galilea, sul monte che Gesù aveva loro indicato." },
      },
      {
        level: 393,
        reference: { it: "Matteo 28,17" },
        text: { it: "Quando lo videro, si inginocchiarono davanti a lui; alcuni però dubitavano." },
      },
      {
        level: 394,
        reference: { it: "Matteo 28,18" },
        text: { it: "Gesù si avvicinò e disse loro: “A me è stato dato ogni potere in cielo e sulla terra”." },
      },
      {
        level: 395,
        reference: { it: "Matteo 28,19" },
        text: { it: "“Andate dunque e fate discepoli tutti i popoli, battezzandoli nel nome del Padre, del Figlio e dello Spirito Santo”." },
      },
      {
        level: 396,
        reference: { it: "Matteo 28,20" },
        text: { it: "“Insegnate loro a osservare tutto ciò che vi ho comandato. Ed ecco, io sono con voi tutti i giorni, fino alla fine del mondo”." },
      },
      {
        level: 397,
        reference: { it: "Giovanni 21,4-6" },
        text: { it: "Quando ormai era l'alba, Gesù si trovò sulla riva, ma i discepoli non si erano accorti che era Gesù. Egli disse loro: “Figlioli, non avete nulla da mangiare?”. Gli risposero: “No”. Allora disse loro: “Gettate la rete dalla parte destra della barca e troverete”. La gettarono e non riuscivano più a tirarla su per la grande quantità di pesci." },
      },
      {
        level: 398,
        reference: { it: "Giovanni 21,9-12" },
        text: { it: "Appena scesero a terra, videro un fuoco di brace con sopra del pesce e del pane. Gesù disse loro: “Portate un po' del pesce che avete preso ora”. Simon Pietro salì nella barca e tirò a terra la rete piena di centocinquantatré grossi pesci. E benché fossero tanti, la rete non si spezzò. Gesù disse loro: “Venite a mangiare”." },
      },
      {
        level: 399,
        reference: { it: "Giovanni 21,15-17" },
        text: { it: "Dopo aver mangiato, Gesù disse a Simon Pietro: “Simone, figlio di Giovanni, mi ami più di costoro?”. Pietro rispose: “Certo, Signore, tu sai che ti voglio bene”. Gesù gli disse: “Pasci i miei agnelli”. Poi gli disse di nuovo: “Simone, figlio di Giovanni, mi ami?”. Pietro rispose: “Certo, Signore, tu sai che ti voglio bene”. Gesù gli disse: “Pasci le mie pecore”. Per la terza volta gli disse: “Simone, figlio di Giovanni, mi vuoi bene?”. Pietro rimase addolorato che per la terza volta gli domandasse: “Mi vuoi bene?”, e gli disse: “Signore, tu conosci tutto; tu sai che ti voglio bene”. Gesù gli disse: “Pasci le mie pecore”." },
      },
      {
        level: 400,
        reference: { it: "Luca 24,50-53" },
        text: { it: "Poi Gesù condusse i discepoli fuori verso Betania e, alzate le mani, li benedisse. Mentre li benediceva, si staccò da loro e veniva portato verso il cielo. Essi si inginocchiarono davanti a lui, poi tornarono a Gerusalemme pieni di gioia e stavano continuamente nel Tempio lodando Dio." },
      },
    ],
  },
];
