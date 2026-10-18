import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from './../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubmissionsService {
  private http = inject(HttpClient);

  public submit(token: string, file: File, module: string, note: string) {
    const headers = new HttpHeaders()
      .set("Authorization", "Bearer " + token);

    const body = new FormData();
    body.append('file', file);
    body.append('consent', 'true');
    if (module.trim()) body.append('module', module.trim());
    if (note.trim()) body.append('note', note.trim());

    return this.http.post<void>(environment.apiUrl + "/submissions", body, {headers});
  }
}
