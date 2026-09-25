import {OPENING_TEXTS} from "./opening_text";

export const LANGUAGES = ["it", "en", "es", "fr"] as const;

export type Language = (typeof LANGUAGES)[number];

export type TextEntry = {
  key: string;
} & Record<Language, string>;

//* Aggiungi una riga per ogni stringa: le chiavi it/en/es/fr sono dinamiche
const UI_TEXTS: TextEntry[] = [
  {
    key: "start",
    it: "Inizia",
    en: "Start",
    es: "Empezar",
    fr: "Commencer",
  },
  {
    key: "settings",
    it: "Impostazioni",
    en: "Settings",
    es: "Ajustes",
    fr: "Réglages",
  },
  {
    key: "objectives",
    it: "Obiettivi",
    en: "Goals",
    es: "Objetivos",
    fr: "Objectifs",
  },
  {
    key: "info",
    it: "Info",
    en: "Info",
    es: "Info",
    fr: "Infos",
  },
  {
    key: "language",
    it: "Lingua",
    en: "Language",
    es: "Idioma",
    fr: "Langue",
  },
  {
    key: "music",
    it: "Musica",
    en: "Music",
    es: "Música",
    fr: "Musique",
  },
  {
    key: "on",
    it: "On",
    en: "On",
    es: "On",
    fr: "On",
  },
  {
    key: "off",
    it: "Off",
    en: "Off",
    es: "Off",
    fr: "Off",
  },
  {
    key: "objectivesBody",
    it: "Abbina tre o più tessere uguali per fare punti. Raggiungi il punteggio e scopri il versetto.",
    en: "Match three or more tiles to score points. Reach the goal and discover the verse.",
    es: "Combina tres o más fichas iguales para sumar puntos. Alcanza la meta y descubre el versículo.",
    fr: "Aligne trois tuiles ou plus pour marquer. Atteins le score et découvre le verset.",
  },
  {
    key: "infoBody",
    it: "Holy Crush unisce fede e gioco. Impara i valori della fede attraverso livelli e sfide, senza noia.",
    en: "Holy Crush mixes faith and play. Learn faith values through levels and challenges, without the boredom.",
    es: "Holy Crush une fe y juego. Aprende los valores de la fe con niveles y retos, sin aburrirte.",
    fr: "Holy Crush mêle foi et jeu. Découvre les valeurs de la foi par des niveaux et des défis, sans ennui.",
  },
  {
    key: "exitTitle",
    it: "Vuoi terminare la partita?",
    en: "Do you want to end the game?",
    es: "¿Quieres terminar la partida?",
    fr: "Veux-tu terminer la partie?",
  },
  {
    key: "confirm",
    it: "Conferma",
    en: "Confirm",
    es: "Confirmar",
    fr: "Confirmer",
  },
  {
    key: "cancel",
    it: "Annulla",
    en: "Cancel",
    es: "Cancelar",
    fr: "Annuler",
  },
  {
    key: "tapToContinue",
    it: "TOCCA PER CONTINUARE",
    en: "TAP TO CONTINUE",
    es: "TOCA PARA CONTINUAR",
    fr: "TOUCHE POUR CONTINUER",
  },
];

export const TEXTS: TextEntry[] = [...UI_TEXTS, ...OPENING_TEXTS];
