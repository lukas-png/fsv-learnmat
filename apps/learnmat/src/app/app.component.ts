import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from './i18n/language.service';
import { LANGUAGES } from './i18n/translations';

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


  home() {
    this.router.navigate(['']);
  }

}
