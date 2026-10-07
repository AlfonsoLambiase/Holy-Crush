import type {Language} from "@/language";

export type LocalizedVerseFields = {
  text: Partial<Record<Language, string>> & {it: string};
  reference: Partial<Record<Language, string>> & {it: string};
};

const BOOK_NAMES: Record<string, Partial<Record<Language, string>>> = {
  Luca: {en: "Luke", es: "Lucas", fr: "Luc"},
  Matteo: {en: "Matthew", es: "Mateo", fr: "Matthieu"},
  Marco: {en: "Mark", es: "Marcos", fr: "Marc"},
  Giovanni: {en: "John", es: "Juan", fr: "Jean"},
  Atti: {en: "Acts", es: "Hechos", fr: "Actes"},
};

/** Converte riferimento CEI (es. Luca 1,26) nella forma locale. */
export const localizeBibleReference = (italianRef: string, language: Language): string => {
  if (language === "it") return italianRef;

  const match = italianRef.trim().match(/^([A-Za-zÀ-ú]+)\s+([\d,\-\s]+)$/u);

  if (!match) return italianRef;

  const [, bookIt, rest] = match;
  const book = BOOK_NAMES[bookIt]?.[language] ?? bookIt;
  const restLocalized = rest.replace(/,/g, language === "en" ? ":" : ",");

  return `${book} ${restLocalized}`.trim();
};

export const pickLocalizedField = (
  fields: LocalizedVerseFields,
  field: keyof LocalizedVerseFields,
  language: Language,
): string => {
  const map = fields[field];
  const direct = map[language];

  if (direct) return direct;

  if (field === "reference" && language !== "it") {
    return localizeBibleReference(map.it, language);
  }

  return map.it;
};

export const resolveLocalizedVerse = (
  entry: LocalizedVerseFields & {level: number},
  language: Language,
): {level: number; text: string; reference: string} => ({
  level: entry.level,
  text: pickLocalizedField(entry, "text", language),
  reference: pickLocalizedField(entry, "reference", language),
});
