import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { LANGUAGES, Language, TRANSLATIONS, TranslationKey } from './translations';

const STORAGE_KEY = 'lang';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private document = inject(DOCUMENT);

  // Saved choice first, otherwise German for German browsers and English for everyone else
  readonly lang = signal<Language>(this.initialLanguage());

  constructor() {
    this.document.documentElement.lang = this.lang();
  }

  set(lang: Language) {
    this.lang.set(lang);
    this.document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage may be unavailable (private mode); the choice then lasts for this page view
    }
  }

  // Replaces {name} placeholders with the given params
  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const text = TRANSLATIONS[this.lang()][key];
    return params ? text.replace(/\{(\w+)\}/g, (match, name) => String(params[name] ?? match)) : text;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(this.lang() === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private initialLanguage(): Language {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && LANGUAGES.includes(saved)) {
        return saved;
      }
    } catch {
      // ignore, fall back to the browser language
    }
    return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
  }
}
