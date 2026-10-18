import { NgModule, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SignupComponent } from './signup/signup.component';
import { BrowserComponent } from './browser/browser.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule} from '@angular/material/form-field';
import {MatListModule} from '@angular/material/list';
import {MatInputModule} from '@angular/material/input';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { ThanksComponent } from './thanks/thanks.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTableModule} from '@angular/material/table';
import { SuccessComponent } from './success/success.component';
import {MatSnackBarModule} from '@angular/material/snack-bar';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { TranslatePipe } from './i18n/translate.pipe';
import { SubmitComponent } from './submit/submit.component';

@NgModule({ declarations: [
        AppComponent,
        SignupComponent,
        BrowserComponent,
        ThanksComponent,
        SuccessComponent,
        SubmitComponent
    ],
    bootstrap: [AppComponent],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ], imports: [BrowserModule,
        AppRoutingModule,
        MatButtonModule,
        MatSnackBarModule,
        MatTableModule,
        MatListModule,
        MatInputModule,
        MatCheckboxModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        TranslatePipe], providers: [
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
