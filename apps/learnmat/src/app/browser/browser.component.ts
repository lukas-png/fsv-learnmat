import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LearningModule } from '../learning-module.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessComponent } from '../success/success.component';
import { ModulesService } from '../modules.service';
import { MatSelectionList } from '@angular/material/list';

@Component({
    selector: 'app-browser',
    templateUrl: './browser.component.html',
    styleUrls: ['./browser.component.css'],
    standalone: false
})
export class BrowserComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private _snackBar = inject(MatSnackBar);
  private modulesService = inject(ModulesService);


  modules: LearningModule[] = [];
  loading = false;

  @ViewChild('modulesList')
  modulesList?: MatSelectionList;

  private token: string | null = null;

  async ngOnInit(): Promise<void> {
    this.token = this.route.snapshot.queryParamMap.get("token");
    if (this.token) {
      try {
        const data = await firstValueFrom(this.modulesService.getModules(this.token));
        this.modules = data.modules;
      } catch {
        this.showError("Die Module konnten nicht geladen werden. Bitte lade die Seite neu.");
      }
    }
  }

  async getLinks() {
    const selection: string[] = this.modulesList?.selectedOptions.selected.map(option => option.value) ?? [];

    if (selection.length == 0) {
      this._snackBar.open("Wähle bitte ein Lernmaterial-Modul aus!", "Okay", {
        duration: 3500
      });
      return;
    }

    const selectedModules = {modules: this.modules.filter(m => selection.includes(m.name))};

    this.loading = true;
    try {
      await firstValueFrom(this.modulesService.getLinks(this.token || "", selectedModules));
      this.modulesList?.deselectAll();
      this._snackBar.openFromComponent(SuccessComponent, {
        duration: 3500
      });
    } catch {
      this.showError("Die Links konnten nicht verschickt werden. Bitte versuche es später erneut.");
    } finally {
      this.loading = false;
    }
  }

  private showError(message: string) {
    this._snackBar.open(message, "Okay", { duration: 5000 });
  }

}
