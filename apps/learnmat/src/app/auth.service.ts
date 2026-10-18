import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { environment } from './../environments/environment';
import { LanguageService } from './i18n/language.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private language = inject(LanguageService);


  public async signup(email: string): Promise<void> {
    await firstValueFrom(this.http.post(environment.apiUrl + '/signup', {
      email,
      lang: this.language.lang()
    }, {
      observe: 'response'
    }));
  }

  public validate(token: string): Observable<HttpResponse<object>> {
    return this.http.post(environment.apiUrl + '/validate', {
      token
    }, {
      observe: 'response'
    });
  }
}
