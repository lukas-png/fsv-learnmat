import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ModulesService } from '../modules.service';
import { SuccessComponent } from '../success/success.component';
import { BrowserComponent } from './browser.component';

describe('BrowserComponent', () => {
  let fixture: ComponentFixture<BrowserComponent>;
  let component: BrowserComponent;
  let snackBar: MatSnackBar;
  const modules = [
    { name: 'Datenbanken', etag: 'db1' },
    { name: 'Mathematik I', etag: 'ma1' },
  ];
  const modulesService = { getModules: jest.fn(), getLinks: jest.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      declarations: [BrowserComponent],
      imports: [MatListModule, MatButtonModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: ModulesService, useValue: modulesService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ token: 'abc' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowserComponent);
    component = fixture.componentInstance;
    snackBar = TestBed.inject(MatSnackBar);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const options = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('mat-list-option'));
  const buttons = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('button'));

  beforeEach(() => {
    modulesService.getModules.mockReset().mockReturnValue(of({ modules }));
    modulesService.getLinks.mockReset().mockReturnValue(of(undefined));
  });

  it('loads the modules with the token from the URL', async () => {
    await setup();

    expect(modulesService.getModules).toHaveBeenCalledWith('abc');
    expect(options().map(o => o.textContent?.trim())).toEqual(['Datenbanken', 'Mathematik I']);
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

    expect(modulesService.getLinks).toHaveBeenCalledWith('abc', { modules: [modules[1]] });
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
