import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LearningModule } from '../learning-module.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessComponent } from '../success/success.component';
import { ModulesService } from '../modules.service';
import { MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { LanguageService } from '../i18n/language.service';
import { TranslationKey } from '../i18n/translations';

// Modules changed within this many days count as "recently updated" and get a "new" badge
const RECENT_DAYS = 30;

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
  protected language = inject(LanguageService);


  modules: LearningModule[] = [];
  loading = false;
  search = '';
  onlyRecent = false;

  // Kept separately from the list, because options hidden by the filter drop out of the list's own selection
  selected = new Set<string>();

  @ViewChild('modulesList')
  modulesList?: MatSelectionList;

  protected token: string | null = null;

  async ngOnInit(): Promise<void> {
    this.token = this.route.snapshot.queryParamMap.get("token");
    if (this.token) {
      try {
        const data = await firstValueFrom(this.modulesService.getModules(this.token));
        this.modules = data.modules;
      } catch {
        this.showError('browse.loadFailed');
      }
    }
  }

  get filteredModules(): LearningModule[] {
    const search = this.search.trim().toLocaleLowerCase();
    return this.modules.filter(module =>
      module.name.toLocaleLowerCase().includes(search) && (!this.onlyRecent || this.isRecent(module)));
  }

  isRecent(module: LearningModule): boolean {
    return !!module.updated && Date.now() - new Date(module.updated).getTime() < RECENT_DAYS * 24 * 60 * 60 * 1000;
  }

  onSelectionChange(event: MatSelectionListChange) {
    for (const option of event.options) {
      if (option.selected) {
        this.selected.add(option.value);
      } else {
        this.selected.delete(option.value);
      }
    }
  }

  clearSelection() {
    this.selected.clear();
    this.modulesList?.deselectAll();
  }

  async getLinks() {
    if (this.selected.size == 0) {
      this._snackBar.open(this.language.t('browse.selectModule'), this.language.t('common.ok'), {
        duration: 3500
      });
      return;
    }

    const selectedModules = {
      modules: this.modules.filter(m => this.selected.has(m.name)).map(({ name, etag }) => ({ name, etag })),
    };

    this.loading = true;
    try {
      await firstValueFrom(this.modulesService.getLinks(this.token || "", selectedModules));
      this.clearSelection();
      this._snackBar.openFromComponent(SuccessComponent, {
        duration: 3500
      });
    } catch {
      this.showError('browse.linksFailed');
    } finally {
      this.loading = false;
    }
  }

  private showError(key: TranslationKey) {
    this._snackBar.open(this.language.t(key), this.language.t('common.ok'), { duration: 5000 });
  }

}
