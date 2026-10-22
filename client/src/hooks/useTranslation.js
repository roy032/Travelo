import { useContext } from 'react';
import { LanguageContext } from '../context/language-context';

/**
 * @returns {{ language: string, setLanguage: (lang: string) => void,
 *   t: (key: string, vars?: object) => string }}
 */
export const useTranslation = () => useContext(LanguageContext);
