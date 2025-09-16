import { fa } from './fa';
import { en } from './en';

export const dictionaries = { fa, en };
export type Locale = keyof typeof dictionaries;
export type TranslationKey = keyof typeof fa | keyof typeof en; // union (should overlap mostly)

export const tFactory = (locale: Locale) => (key: TranslationKey): string => {
  const dict = dictionaries[locale] as Record<string,string>;
  return dict[key] || key;
};
