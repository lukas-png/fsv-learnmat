import { Component, inject } from '@angular/core';
import { LanguageService } from '../i18n/language.service';

export const ASTA_IMPRINT_URL = 'https://asta-hildesheim.de/impressum/';
export const ASTA_PRIVACY_URL = 'https://asta-hildesheim.de/datenschutzerklaerung/';
// The university's data protection officer also serves the AStA
export const UNI_DPO_URL = 'https://www.uni-hildesheim.de/datenschutz/';

// Legal text is kept as whole paragraphs per language instead of single translation keys
@Component({
    selector: 'app-privacy',
    templateUrl: './privacy.component.html',
    styleUrls: ['./privacy.component.css'],
    standalone: false
})
export class PrivacyComponent {
  protected language = inject(LanguageService);
  protected imprintUrl = ASTA_IMPRINT_URL;
  protected astaPrivacyUrl = ASTA_PRIVACY_URL;
  protected dpoUrl = UNI_DPO_URL;
}
