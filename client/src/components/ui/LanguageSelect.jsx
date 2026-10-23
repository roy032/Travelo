import { Languages } from "lucide-react";
import { LANGUAGES } from "../../i18n";
import { useTranslation } from "../../hooks/useTranslation";

/**
 * Compact language picker. Shows the short code (EN, ES) to fit the navbar;
 * each option carries its own lang so it is read in that language.
 */
const LanguageSelect = ({ className = "" }) => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <label
      className={`relative flex items-center rounded-lg text-gray-600 hover:bg-gray-100 focus-within:ring-2 focus-within:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800 ${className}`}
      title={t("common.language")}
    >
      <span className='sr-only'>{t("common.language")}</span>
      <Languages size={18} className='pointer-events-none absolute left-2' aria-hidden='true' />
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className='appearance-none cursor-pointer bg-transparent py-2 pl-8 pr-2 text-sm font-medium text-gray-700 focus:outline-none dark:text-gray-200'
      >
        {Object.entries(LANGUAGES).map(([code, { label, short }]) => (
          <option
            key={code}
            value={code}
            lang={code}
            aria-label={label}
            className='bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100'
          >
            {short}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSelect;
