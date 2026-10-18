import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LanguageService } from '../i18n/language.service';


@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css'],
    standalone: false
})
export class SignupComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private language = inject(LanguageService);

  public signupForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.pattern(".+@uni-hildesheim\\.de")],
    }),
  });

  loading = false;

  public hasError = (controlName: 'email', errorName: string) =>{
    return this.signupForm.controls[controlName].hasError(errorName);
  }

  async signup() {
    if (!this.signupForm.valid) {
      return;
    }

    this.loading = true;
    try {
      await this.auth.signup(this.signupForm.getRawValue().email);
      this.router.navigate(['thanks']);
    } catch (error) {
      const message = error instanceof HttpErrorResponse && error.status === 429
        ? this.language.t('signup.rateLimited')
        : this.language.t('signup.failed');
      this.snackBar.open(message, this.language.t('common.ok'), { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

}
