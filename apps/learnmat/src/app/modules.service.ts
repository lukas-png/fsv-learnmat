import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { LearningModule } from './learning-module.model';
import { environment } from './../environments/environment';
import { LanguageService } from './i18n/language.service';

@Injectable({
  providedIn: 'root'
})
export class ModulesService {
  private http = inject(HttpClient);
  private language = inject(LanguageService);


  public getModules(token: string) {
    const headers = new HttpHeaders()
      .set("Authorization", "Bearer " + token);

    return this.http.get<{modules: LearningModule[]}>(environment.apiUrl + "/modules", {headers});
  }

  public getLinks(token: string, modules: {modules: LearningModule[]}) {
    const headers = new HttpHeaders()
      .set("Authorization", "Bearer " + token);
      return this.http.post<void>(environment.apiUrl + "/modules", {...modules, lang: this.language.lang()}, {headers});
  }

}
