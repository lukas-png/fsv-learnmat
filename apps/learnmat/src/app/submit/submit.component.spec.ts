import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LanguageService } from '../i18n/language.service';
import { TranslatePipe } from '../i18n/translate.pipe';
import { ModulesService } from '../modules.service';
import { SubmissionsService } from '../submissions.service';
import { SubmitComponent } from './submit.component';

describe('SubmitComponent', () => {
  let fixture: ComponentFixture<SubmitComponent>;
  let component: SubmitComponent;
  let snackBar: jest.SpyInstance;
  const modulesService = { getModules: jest.fn() };
  const submissionsService = { submit: jest.fn() };

  const pdf = (size = 1000) => new File([new Uint8Array(size)], 'klausur.pdf', { type: 'application/pdf' });
  const select = (file: File) => component.onFileSelected({ target: { files: [file] } } as unknown as Event);
  const submitButton = (): HTMLButtonElement => fixture.nativeElement.querySelector('button[type=submit]');

  beforeEach(async () => {
    modulesService.getModules.mockReset().mockReturnValue(of({ modules: [{ name: 'Datenbanken', etag: 'a' }] }));
    submissionsService.submit.mockReset().mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      declarations: [SubmitComponent],
      imports: [TranslatePipe, FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ModulesService, useValue: modulesService },
        { provide: SubmissionsService, useValue: submissionsService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ token: 'abc' }) } } },
      ],
    }).compileComponents();
    TestBed.inject(LanguageService).set('de');

    fixture = TestBed.createComponent(SubmitComponent);
    component = fixture.componentInstance;
    snackBar = jest.spyOn(TestBed.inject(MatSnackBar), 'open');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('offers the existing modules as suggestions', () => {
    const options = Array.from(fixture.nativeElement.querySelectorAll('datalist option')) as HTMLOptionElement[];
    expect(options.map(o => o.value)).toEqual(['Datenbanken']);
  });

  it('only enables the button with a file and consent', async () => {
    expect(submitButton().disabled).toBe(true);

    select(pdf());
    fixture.detectChanges();
    expect(submitButton().disabled).toBe(true);

    component.consent = true;
    fixture.detectChanges();
    expect(submitButton().disabled).toBe(false);
  });

  it('rejects files over 20 MB in the browser', () => {
    select(pdf(21 * 1024 * 1024));

    expect(component.file).toBeNull();
    expect(snackBar).toHaveBeenCalledWith(expect.stringContaining('zu groß'), 'Okay', expect.anything());
  });

  it('rejects unsupported file types in the browser', () => {
    select(new File(['x'], 'notes.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));

    expect(component.file).toBeNull();
    expect(snackBar).toHaveBeenCalledWith(expect.stringContaining('PDF-, JPG- oder PNG'), 'Okay', expect.anything());
  });

  it('submits file, module and note and resets the form', async () => {
    const file = pdf();
    select(file);
    component.module = 'Datenbanken';
    component.note = 'WiSe 25/26';
    component.consent = true;

    await component.submit();

    expect(submissionsService.submit).toHaveBeenCalledWith('abc', file, 'Datenbanken', 'WiSe 25/26');
    expect(snackBar).toHaveBeenCalledWith(expect.stringContaining('Danke'), 'Okay', expect.anything());
    expect([component.file, component.module, component.note, component.consent]).toEqual([null, '', '', false]);
  });

  it.each([
    [413, 'zu groß'],
    [415, 'PDF-, JPG- oder PNG'],
    [429, 'Zu viele Einreichungen'],
    [500, 'nicht geklappt'],
  ])('shows a matching message for HTTP %i and keeps the input', async (status, message) => {
    submissionsService.submit.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    select(pdf());
    component.module = 'Datenbanken';
    component.consent = true;

    await component.submit();

    expect(snackBar).toHaveBeenCalledWith(expect.stringContaining(message), 'Okay', expect.anything());
    expect(component.module).toBe('Datenbanken');
    expect(component.loading).toBe(false);
  });

  it('formats small files in KB', () => {
    select(pdf(2048));
    expect(component.fileSize).toBe('2 KB');
  });
});
