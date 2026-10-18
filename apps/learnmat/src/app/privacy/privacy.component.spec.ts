import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageService } from '../i18n/language.service';
import { ASTA_IMPRINT_URL, PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [PrivacyComponent] }).compileComponents();
    fixture = TestBed.createComponent(PrivacyComponent);
  });

  const render = (lang: 'de' | 'en') => {
    TestBed.inject(LanguageService).set(lang);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it.each([
    ['de', 'Datenschutzerklärung'],
    ['en', 'Privacy policy'],
  ] as const)('shows the %s version', (lang, title) => {
    const element = render(lang);

    expect(element.querySelector('h1')?.textContent).toBe(title);
    expect(element.querySelectorAll('h2').length).toBe(8);
  });

  it('links to the AStA imprint in a new tab', () => {
    const link = render('de').querySelector(`a[href="${ASTA_IMPRINT_URL}"]`) as HTMLAnchorElement;

    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
  });
});
