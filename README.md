# A Game to Discover, Experience, and Share Faith

An app that combines religion, gaming, and learning in an engaging experience designed for people of all ages.

The goal is to make discovering faith and its values engaging, fun, and accessible, without turning religion into a simple list of facts to memorize.

Users can explore religious content through challenges, missions, questions, puzzles, and interactive journeys, earning points and unlocking new levels as they learn.

## Obiettivo

Gioco in stile Candy Crush. La struttura va tenuta modulare: in futuro si aggiungono stage, opening e livelli. Non aggiungere funzionalità che non sono state chieste.

Flusso:

Home (pulsante START) → Opening dello stage corrente → Stage (mappa / stage road) → Livello.

Ogni opening corrisponde a uno stage diverso:

- Opening 1 → Stage 1
- Opening 2 → Stage 2
- Opening 3 → Stage 3
- e così via

## Opening

Sequenza di immagini numerate, sempre in ordine. Su ogni immagine una scritta si scrive da sola e racconta l'evento dell'immagine. Finita l'opening si passa allo stage.

## Stage

Ogni stage ha:

- un background dedicato, uno per stage (`backgroundStage_0`, `_1`, `_2`…): sono ancora in completamento, ma alla fine ci sono tutti. È anche lo sfondo della partita e del finale di quel livello
- il contenuto grafico dello stage
- eventuali elementi in sovraimpressione
- una stage road, il percorso sulla mappa
- i pulsanti dei livelli lungo quel percorso

Le stage road sono di meno degli stage. Si riusano in parti uguali: con 6 road, la stessa road vale per 2 stage di fila (`road_0` sugli stage 0 e 1, `road_1` su 2 e 3, e così via). Se il rapporto cambia, si aggiornano `ROAD_COUNT` e `ROAD_REUSE` in `phaser/shared/config/asset-paths.const.ts`.

Ogni stage ha da 4 a 5 livelli. Completati tutti, si passa allo stage successivo (opening successivo, poi la sua mappa).

## Livelli

Due stati:

1. Bloccato: pulsante Play Block, non si gioca.
2. Sbloccato: pulsante Play, apre il livello.

Il primo livello dello stage è aperto. Gli altri si sbloccano vincendo il precedente. I successivi restano bloccati finché non tocca a loro.

## Progressione

Salvataggio solo locale sul dispositivo. Niente Firebase per ora, ma il salvataggio va tenuto isolato così dopo si può sostituire senza toccare opening, stage e livelli.

Va ricordato almeno lo stage e il livello raggiunto.

Esempio: il giocatore è al livello 3 dello Stage 2, chiude l'app, riapre e ritrova quello stesso punto.

Al riavvio:

- parte di nuovo l'opening dello stage in cui si trova
- finita l'opening, si mostra la stage road di quello stage
- il livello raggiunto è disponibile, i successivi restano bloccati

Esempio: Stage 2, livello 3 → riapre → Opening 2 → stage road dello Stage 2 → livello 3 aperto, i dopo ancora bloccati.

## Dove sta nel codice

- Home: `src/components/HomeScreen.tsx`
- Opening: `phaser/scenes/opening.ts` — testi in `src/language/opening_text/`
- Mappa stage / stage road: `phaser/scenes/stage-map.ts`
- Livello (versetto + partita): `phaser/scenes/verse.ts`, `phaser/scenes/game.ts`
- Progressione locale: `src/settings/progress.ts`
- Immagini: `public/stages/stage_opening/op_N.png`, `public/stages/stage_background/backgroundStage_N.png`, `public/stages/stage_road/road_N.png`
- Pulsanti: `public/ui_game/btnPlay.png`, `btnPlayBlock.png`, `btnRead.png`, `btnExitGame.png`

I file degli stage partono da 0 (`op_0` è l'Opening 1).
