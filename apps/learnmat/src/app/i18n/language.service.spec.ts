import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { TRANSLATIONS } from './translations';

describe('LanguageService', () => {
  const setBrowserLanguage = (lang: string) => jest.spyOn(navigator, 'language', 'get').mockReturnValue(lang);

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['de-DE', 'de'],
    ['de-AT', 'de'],
    ['en-US', 'en'],
    ['fr-FR', 'en'],
  ])('defaults to the browser language %s -> %s', (browser, expected) => {
    setBrowserLanguage(browser);
    expect(TestBed.inject(LanguageService).lang()).toBe(expected);
  });

  it('prefers a saved choice over the browser language', () => {
    setBrowserLanguage('de-DE');
    localStorage.setItem('lang', 'en');
    expect(TestBed.inject(LanguageService).lang()).toBe('en');
  });

  it('ignores an unknown saved value', () => {
    setBrowserLanguage('de-DE');
    localStorage.setItem('lang', 'xx');
    expect(TestBed.inject(LanguageService).lang()).toBe('de');
  });

  it('saves the choice, sets <html lang> and translates', () => {
    const service = TestBed.inject(LanguageService);

    service.set('en');
    expect(localStorage.getItem('lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(service.t('browse.getLinks')).toBe('Get links');

    service.set('de');
    expect(service.t('browse.getLinks')).toBe('Links erhalten');
  });

  it('has no empty translations', () => {
    for (const texts of Object.values(TRANSLATIONS)) {
      expect(Object.values(texts).filter(text => !text.trim())).toEqual([]);
    }
  });
});
