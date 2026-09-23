"use client";

import {createContext, useContext, useMemo, useSyncExternalStore} from "react";

import {DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, isLanguage, t, type Language} from ".";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

let currentLanguage: Language = DEFAULT_LANGUAGE;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (saved && isLanguage(saved)) currentLanguage = saved;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => listeners.delete(listener);
};

const getLanguage = () => currentLanguage;
const getServerLanguage = () => DEFAULT_LANGUAGE;

const setStoredLanguage = (language: Language) => {
  currentLanguage = language;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  listeners.forEach((listener) => listener());
};

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const language = useSyncExternalStore(subscribe, getLanguage, getServerLanguage);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setStoredLanguage,
      t: (key) => t(key, language),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage va usato dentro LanguageProvider");
  }

  return context;
}
