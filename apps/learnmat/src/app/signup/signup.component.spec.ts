import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { SignupComponent } from './signup.component';
import { LanguageService } from '../i18n/language.service';
import { TranslatePipe } from '../i18n/translate.pipe';

describe('SignupComponent', () => {
  let fixture: ComponentFixture<SignupComponent>;
  let component: SignupComponent;
  const auth = { signup: jest.fn() };
  const router = { navigate: jest.fn() };

  beforeEach(async () => {
    auth.signup.mockReset().mockResolvedValue(undefined);
    router.navigate.mockReset();

    await TestBed.configureTestingModule({
      declarations: [SignupComponent],
      imports: [TranslatePipe, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    TestBed.inject(LanguageService).set('de');

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const button = (): HTMLButtonElement => fixture.nativeElement.querySelector('button');
  const enterEmail = (email: string) => {
    component.signupForm.controls.email.setValue(email);
    fixture.detectChanges();
  };

  it.each([
    ['empty', ''],
    ['not an email', 'max'],
    ['not a university address', 'max@gmail.com'],
    ['a look-alike domain', 'max@uni-hildesheimXde'],
  ])('disables the button when the address is %s', (_, email) => {
    enterEmail(email);
    expect(component.signupForm.valid).toBe(false);
    expect(button().disabled).toBe(true);
  });

  it('signs up and navigates to the thanks page', async () => {
    enterEmail('max.mustermann@uni-hildesheim.de');
    expect(button().disabled).toBe(false);

    await component.signup();

    expect(auth.signup).toHaveBeenCalledWith('max.mustermann@uni-hildesheim.de');
    expect(router.navigate).toHaveBeenCalledWith(['thanks']);
    expect(component.loading).toBe(false);
  });

  it('shows a rate-limit hint on 429 and stays on the page', async () => {
    const snackBar = jest.spyOn(TestBed.inject(MatSnackBar), 'open');
    auth.signup.mockRejectedValue(new HttpErrorResponse({ status: 429 }));
    enterEmail('max.mustermann@uni-hildesheim.de');

    await component.signup();

    expect(snackBar).toHaveBeenCalledWith(expect.stringContaining('Zu viele Anfragen'), 'Okay', expect.anything());
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('shows a generic error on other failures', async () => {
    const snackBar = jest.spyOn(TestBed.inject(MatSnackBar), 'open');
    auth.signup.mockRejectedValue(new HttpErrorResponse({ status: 500 }));
    enterEmail('max.mustermann@uni-hildesheim.de');

    await component.signup();

    expect(snackBar).toHaveBeenCalledWith(expect.stringContaining('nicht geklappt'), 'Okay', expect.anything());
  });

  it('switches the texts when the language changes', () => {
    const title = () => fixture.nativeElement.querySelector('h1').textContent.trim();
    expect(title()).toBe('Anmeldung zum Lernmaterial-Verteiler');

    TestBed.inject(LanguageService).set('en');
    fixture.detectChanges();

    expect(title()).toBe('Sign up for the study material distribution');
    expect(button().textContent.trim()).toBe('Request access');
  });

  it('disables the button while the request is running', async () => {
    let resolve!: () => void;
    auth.signup.mockReturnValue(new Promise<void>(r => (resolve = r)));
    enterEmail('max.mustermann@uni-hildesheim.de');

    const pending = component.signup();
    fixture.detectChanges();
    expect(button().disabled).toBe(true);

    resolve();
    await pending;
    fixture.detectChanges();
    expect(button().disabled).toBe(false);
  });
});
