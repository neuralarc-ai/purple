import { en } from './en';
import { mr } from './mr';
import { de } from './de';
import { ar } from './ar';
import { ja } from './ja';
import { zh } from './zh';

export const translations = {
  en,
  mr,
  de,
  ar,
  ja,
  zh
};

export type Language = keyof typeof translations;
export type TranslationKeys = typeof en;

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' }
] as const;
