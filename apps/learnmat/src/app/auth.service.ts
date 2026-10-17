import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { environment } from './../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);


  public async signup(email: string): Promise<void> {
    await firstValueFrom(this.http.post(environment.apiUrl + '/signup', {
      email
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
