export type Verse = {
  stage: number;
  text: string;
  reference: string;
};

//* Modifica qui il versetto mostrato prima di ogni stage.
export const VERSES: Verse[] = [
  {
    stage: 1,
    text: "Tutto posso in colui che mi dà la forza.",
    reference: "Filippesi 4:13",
  },
  {
    stage: 2,
    text: "Il Signore è la mia luce e la mia salvezza: di chi avrò timore?",
    reference: "Salmi 27:1",
  },
];

export const getVerseByStage = (stage: number): Verse =>
  VERSES.find((verse) => verse.stage === stage) ?? VERSES[0];
