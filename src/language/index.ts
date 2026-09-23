import {LANGUAGES, TEXTS, type Language} from "./texts";

export {LANGUAGES, TEXTS, type Language, type TextEntry} from "./texts";

export const LANGUAGE_LABELS: Record<Language, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  fr: "Français",
};

export const DEFAULT_LANGUAGE: Language = "it";

export const LANGUAGE_STORAGE_KEY = "holy-crush-language";

export const getCurrentLanguage = (): Language => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  return saved && isLanguage(saved) ? saved : DEFAULT_LANGUAGE;
};

export const isLanguage = (value: string): value is Language =>
  (LANGUAGES as readonly string[]).includes(value);

export const t = (key: string, language: Language): string => {
  const entry = TEXTS.find((row) => row.key === key);

  return entry?.[language] ?? entry?.it ?? key;
};
