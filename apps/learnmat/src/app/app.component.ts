import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from './i18n/language.service';
import { LANGUAGES } from './i18n/translations';
import { ASTA_IMPRINT_URL } from './privacy/privacy.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
  private router = inject(Router);
  protected language = inject(LanguageService);
  protected languages = LANGUAGES;
  protected imprintUrl = ASTA_IMPRINT_URL;


  home() {
    this.router.navigate(['']);
  }

}
