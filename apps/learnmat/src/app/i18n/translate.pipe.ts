import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';
import { TranslationKey } from './translations';

// Impure so that templates update when the language is switched
@Pipe({
  name: 't',
  pure: false,
  standalone: true,
})
export class TranslatePipe implements PipeTransform {
  private language = inject(LanguageService);

  transform(key: TranslationKey, params?: Record<string, string | number>): string {
    return this.language.t(key, params);
  }
}
