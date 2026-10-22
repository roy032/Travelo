import { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./language-context";
import { STORAGE_KEY, detectLanguage, isSupported, translate } from "../i18n";

/**
 * Interface language. Starts from the saved choice or the browser's
 * language and keeps <html lang> in step so screen readers pronounce
 * the text correctly.
 */
export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(detectLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next) => {
    if (!isSupported(next)) return;
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice lasts until the page is closed
    }
  }, []);

  const t = useCallback(
    (key, vars) => translate(language, key, vars),
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};
