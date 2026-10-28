import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LANGUAGES, STORAGE_KEY, detectLanguage, translate } from "..";

// Every key path whose value is a string
const keyPaths = (node, prefix = "") =>
  Object.entries(node).flatMap(([key, value]) =>
    typeof value === "string"
      ? [`${prefix}${key}`]
      : keyPaths(value, `${prefix}${key}.`)
  );

const placeholders = (text) => (text.match(/\{\w+\}/g) || []).sort();

describe("translations", () => {
  const englishKeys = keyPaths(LANGUAGES.en.messages).sort();

  it.each(Object.keys(LANGUAGES))("%s has exactly the English keys", (code) => {
    expect(keyPaths(LANGUAGES[code].messages).sort()).toEqual(englishKeys);
  });

  it.each(Object.keys(LANGUAGES))("%s keeps every {placeholder}", (code) => {
    for (const key of englishKeys) {
      expect(placeholders(translate(code, key)), key).toEqual(
        placeholders(translate("en", key))
      );
    }
  });
});

describe("translate", () => {
  it("looks up nested keys in the chosen language", () => {
    expect(translate("en", "nav.myTrips")).toBe("My Trips");
    expect(translate("es", "nav.myTrips")).toBe("Mis viajes");
  });

  it("fills placeholders and leaves unknown ones alone", () => {
    expect(translate("es", "nav.accountMenu", { name: "Ana" })).toBe(
      "Menú de la cuenta de Ana"
    );
    expect(translate("en", "nav.accountMenu")).toBe("Account menu for {name}");
  });

  it("falls back to English, then to the key", () => {
    expect(translate("fr", "nav.explore")).toBe("Explore");
    expect(translate("es", "no.such.key")).toBe("no.such.key");
  });
});

describe("detectLanguage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  const stubLanguages = (languages) =>
    vi.stubGlobal("navigator", { ...navigator, languages, language: languages[0] });

  it("prefers the saved choice", () => {
    stubLanguages(["en-US"]);
    localStorage.setItem(STORAGE_KEY, "es");
    expect(detectLanguage()).toBe("es");
  });

  it("uses the first supported browser language", () => {
    stubLanguages(["fr-FR", "es-MX", "en"]);
    expect(detectLanguage()).toBe("es");
  });

  it("ignores an unsupported saved value and defaults to English", () => {
    stubLanguages(["de-DE"]);
    localStorage.setItem(STORAGE_KEY, "klingon");
    expect(detectLanguage()).toBe("en");
  });
});
