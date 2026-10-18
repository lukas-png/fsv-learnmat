import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, RouterLink, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ModulesService } from '../modules.service';
import { SuccessComponent } from '../success/success.component';
import { BrowserComponent } from './browser.component';
import { LanguageService } from '../i18n/language.service';
import { TranslatePipe } from '../i18n/translate.pipe';

describe('BrowserComponent', () => {
  let fixture: ComponentFixture<BrowserComponent>;
  let component: BrowserComponent;
  let snackBar: MatSnackBar;
  const modules = [
    { name: 'Datenbanken', etag: 'db1', updated: new Date(Date.now() - 2 * 864e5).toISOString() },
    { name: 'Mathematik I', etag: 'ma1', updated: '2025-01-15T10:00:00.000Z' },
  ];
  const modulesService = { getModules: jest.fn(), getLinks: jest.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      declarations: [BrowserComponent],
      imports: [TranslatePipe, RouterLink, FormsModule, MatListModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ModulesService, useValue: modulesService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ token: 'abc' }) } } },
      ],
    }).compileComponents();
    TestBed.inject(LanguageService).set('de');

    fixture = TestBed.createComponent(BrowserComponent);
    component = fixture.componentInstance;
    snackBar = TestBed.inject(MatSnackBar);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const options = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('mat-list-option'));
  const names = () => options().map(o => o.querySelector('.module-name')?.textContent?.trim());
  const buttons = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('button'));

  beforeEach(() => {
    modulesService.getModules.mockReset().mockReturnValue(of({ modules }));
    modulesService.getLinks.mockReset().mockReturnValue(of(undefined));
  });

  it('loads the modules with the token from the URL', async () => {
    await setup();

    expect(modulesService.getModules).toHaveBeenCalledWith('abc');
    expect(names()).toEqual(['Datenbanken', 'Mathematik I']);
  });

  it('marks recently updated modules and shows the update date', async () => {
    await setup();

    expect(options()[0].querySelector('.badge')?.textContent).toBe('Neu');
    expect(options()[1].querySelector('.badge')).toBeNull();
    expect(options()[1].querySelector('.updated')?.textContent).toContain('15. Januar 2025');
  });

  it('filters by search text, case-insensitively', async () => {
    await setup();

    component.search = 'MATHE';
    fixture.detectChanges();

    expect(names()).toEqual(['Mathematik I']);
  });

  it('shows only recently updated modules when asked', async () => {
    await setup();

    component.onlyRecent = true;
    fixture.detectChanges();

    expect(names()).toEqual(['Datenbanken']);
  });

  it('shows a hint when nothing matches', async () => {
    await setup();

    component.search = 'xyz';
    fixture.detectChanges();

    expect(options().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.no-results')).not.toBeNull();
  });

  it('keeps selected modules that are hidden by the filter', async () => {
    await setup();
    options()[0].click();
    fixture.detectChanges();

    component.search = 'mathe';
    fixture.detectChanges();
    options()[0].click();
    fixture.detectChanges();
    component.search = '';
    fixture.detectChanges();
    await component.getLinks();

    expect(modulesService.getLinks).toHaveBeenCalledWith('abc', {
      modules: [{ name: 'Datenbanken', etag: 'db1' }, { name: 'Mathematik I', etag: 'ma1' }],
    });
  });

  it('shows an error if the modules cannot be loaded', async () => {
    modulesService.getModules.mockReturnValue(throwError(() => new Error('500')));
    const open = jest.spyOn(MatSnackBar.prototype, 'open');

    await setup();

    expect(open).toHaveBeenCalledWith(expect.stringContaining('nicht geladen'), 'Okay', expect.anything());
    open.mockRestore();
  });

  it('asks to select a module when nothing is selected', async () => {
    await setup();
    const open = jest.spyOn(snackBar, 'open');

    await component.getLinks();

    expect(open).toHaveBeenCalledWith(expect.stringContaining('Wähle bitte'), 'Okay', expect.anything());
    expect(modulesService.getLinks).not.toHaveBeenCalled();
  });

  it('requests links for the selected modules and shows the success message', async () => {
    await setup();
    const openFromComponent = jest.spyOn(snackBar, 'openFromComponent');
    options()[1].click();
    fixture.detectChanges();

    await component.getLinks();
    fixture.detectChanges();

    expect(modulesService.getLinks).toHaveBeenCalledWith('abc', { modules: [{ name: 'Mathematik I', etag: 'ma1' }] });
    expect(component.selected.size).toBe(0);
    expect(openFromComponent).toHaveBeenCalledWith(SuccessComponent, expect.anything());
    expect(component.modulesList?.selectedOptions.selected.length).toBe(0);
  });

  it('keeps the selection and shows an error if the request fails', async () => {
    modulesService.getLinks.mockReturnValue(throwError(() => new Error('502')));
    await setup();
    const open = jest.spyOn(snackBar, 'open');
    const openFromComponent = jest.spyOn(snackBar, 'openFromComponent');
    options()[0].click();
    fixture.detectChanges();

    await component.getLinks();

    expect(open).toHaveBeenCalledWith(expect.stringContaining('nicht verschickt'), 'Okay', expect.anything());
    expect(openFromComponent).not.toHaveBeenCalledWith(SuccessComponent, expect.anything());
    expect(component.modulesList?.selectedOptions.selected.length).toBe(1);
    expect(component.loading).toBe(false);
  });

  it('shows a rate-limit hint on 429', async () => {
    modulesService.getLinks.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 429 })));
    await setup();
    const open = jest.spyOn(snackBar, 'open');
    options()[0].click();
    fixture.detectChanges();

    await component.getLinks();

    expect(open).toHaveBeenCalledWith(expect.stringContaining('zu viele Links'), 'Okay', expect.anything());
  });

  it('disables both buttons while the request is running', async () => {
    let finish!: () => void;
    modulesService.getLinks.mockReturnValue(new Promise<void>(r => (finish = r)));
    await setup();
    options()[0].click();
    fixture.detectChanges();

    const pending = component.getLinks();
    fixture.detectChanges();
    expect(buttons().every(b => b.disabled)).toBe(true);

    finish();
    await pending;
    fixture.detectChanges();
    expect(buttons().every(b => !b.disabled)).toBe(true);
  });
});
