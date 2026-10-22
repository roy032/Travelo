import en from "./locales/en";
import es from "./locales/es";

export const STORAGE_KEY = "travelo-language";
export const DEFAULT_LANGUAGE = "en";

// `label` is each language's own name, shown in the language picker
export const LANGUAGES = {
  en: { label: "English", short: "EN", messages: en },
  es: { label: "Español", short: "ES", messages: es },
};

const lookup = (messages, key) =>
  key.split(".").reduce((node, part) => node?.[part], messages);

/**
 * Translate `key` (e.g. "nav.myTrips") into `language`, filling {name}
 * placeholders from `vars`. Falls back to English, then to the key itself,
 * so a missing string never blanks the UI.
 */
export const translate = (language, key, vars) => {
  const found =
    lookup(LANGUAGES[language]?.messages, key) ??
    lookup(LANGUAGES[DEFAULT_LANGUAGE].messages, key);
  const text = typeof found === "string" ? found : key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    vars[name] !== undefined ? String(vars[name]) : match
  );
};

export const isSupported = (language) =>
  Object.prototype.hasOwnProperty.call(LANGUAGES, language);

/**
 * The saved choice, else the first supported browser language, else English.
 */
export const detectLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;
  } catch {
    // Storage blocked: fall through to the browser setting
  }
  const preferred =
    typeof navigator === "undefined"
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
  for (const tag of preferred) {
    const base = String(tag || "").toLowerCase().split("-")[0];
    if (isSupported(base)) return base;
  }
  return DEFAULT_LANGUAGE;
};
