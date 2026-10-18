import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { LanguageService } from '../i18n/language.service';
import { TranslationKey } from '../i18n/translations';
import { LearningModule } from '../learning-module.model';
import { ModulesService } from '../modules.service';
import { SubmissionsService } from '../submissions.service';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

@Component({
    selector: 'app-submit',
    templateUrl: './submit.component.html',
    styleUrls: ['./submit.component.css'],
    standalone: false
})
export class SubmitComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private modulesService = inject(ModulesService);
  private submissionsService = inject(SubmissionsService);
  private language = inject(LanguageService);

  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;

  token = '';
  modules: LearningModule[] = [];
  module = '';
  note = '';
  consent = false;
  file: File | null = null;
  loading = false;

  async ngOnInit(): Promise<void> {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    try {
      // Only used as suggestions for the module field, so a failure is not worth an error message
      this.modules = (await firstValueFrom(this.modulesService.getModules(this.token))).modules;
    } catch {
      this.modules = [];
    }
  }

  get fileSize(): string {
    if (!this.file) return '';
    const format = (value: number) => value.toLocaleString(this.language.lang(), { maximumFractionDigits: 1 });
    return this.file.size < 1024 * 1024
      ? format(Math.max(this.file.size / 1024, 0.1)) + ' KB'
      : format(this.file.size / 1024 / 1024) + ' MB';
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (file && file.size > MAX_FILE_SIZE) {
      this.reject('submit.tooLarge');
    } else if (file && !ALLOWED_TYPES.includes(file.type)) {
      this.reject('submit.wrongType');
    } else {
      this.file = file;
    }
  }

  async submit() {
    if (!this.file || !this.consent) {
      return;
    }

    this.loading = true;
    try {
      await firstValueFrom(this.submissionsService.submit(this.token, this.file, this.module, this.note));
      this.snackBar.open(this.language.t('submit.success'), this.language.t('common.ok'), { duration: 6000 });
      this.reset();
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      this.showError(status === 413 ? 'submit.tooLarge'
        : status === 415 ? 'submit.wrongType'
        : status === 429 ? 'submit.rateLimited'
        : 'submit.failed');
    } finally {
      this.loading = false;
    }
  }

  private reject(key: TranslationKey) {
    this.file = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    this.showError(key);
  }

  private reset() {
    this.module = '';
    this.note = '';
    this.consent = false;
    this.file = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  private showError(key: TranslationKey) {
    this.snackBar.open(this.language.t(key), this.language.t('common.ok'), { duration: 5000 });
  }
}
