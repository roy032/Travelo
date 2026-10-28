import { createContext } from "react";
import { DEFAULT_LANGUAGE, translate } from "../i18n";

// The default lets components render in English without a provider (tests)
export const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, vars) => translate(DEFAULT_LANGUAGE, key, vars),
});
