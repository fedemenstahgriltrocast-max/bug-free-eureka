import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations } from './dictionary.js';

const STORAGE_KEY = 'marxia-lang';

function normalizeLanguage(language) {
  if (!language) return DEFAULT_LANGUAGE;
  const normalized = language.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : DEFAULT_LANGUAGE;
}

export function createI18nManager({
  html = typeof document !== 'undefined' ? document.documentElement : undefined,
  storage = typeof window !== 'undefined' ? window.localStorage : undefined,
  initialLanguage,
} = {}) {
  let currentLanguage = normalizeLanguage(initialLanguage || html?.lang);
  const listeners = new Set();

  if (html) {
    html.lang = currentLanguage;
  }

  if (storage) {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      currentLanguage = stored;
      if (html) {
        html.lang = currentLanguage;
      }
    } else {
      storage.setItem(STORAGE_KEY, currentLanguage);
    }
  }

  const notify = () => {
    listeners.forEach((listener) => {
      try {
        listener(currentLanguage);
      } catch (error) {
        console.error('i18n listener error', error);
      }
    });
  };

  const getDictionary = (lang = currentLanguage) => translations[normalizeLanguage(lang)] ?? {};

  const format = (key, replacements = {}, lang = currentLanguage) => {
    const dictionary = getDictionary(lang);
    const template = dictionary[key];
    if (template === undefined) {
      return undefined;
    }
    return Object.entries(replacements).reduce(
      (acc, [token, value]) => acc.replace(new RegExp(`\\{${token}\\}`, 'g'), String(value)),
      template,
    );
  };

  const translate = (key, lang = currentLanguage) => getDictionary(lang)[key];

  const setLanguage = (lang) => {
    const nextLanguage = normalizeLanguage(lang);
    if (nextLanguage === currentLanguage) {
      return currentLanguage;
    }
    currentLanguage = nextLanguage;
    if (html) {
      html.lang = currentLanguage;
    }
    if (storage) {
      storage.setItem(STORAGE_KEY, currentLanguage);
    }
    notify();
    return currentLanguage;
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    get language() {
      return currentLanguage;
    },
    setLanguage,
    translate,
    format,
    subscribe,
    getDictionary,
  };
}

export { translations };
