import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SignupComponent } from './signup/signup.component';
import { BrowserComponent } from './browser/browser.component';
import { ThanksComponent } from './thanks/thanks.component';
import { BrowserGuard } from './browser.guard';
import { SubmitComponent } from './submit/submit.component';
import { PrivacyComponent } from './privacy/privacy.component';

const routes: Routes = [
  { path: 'browse', component: BrowserComponent, canActivate: [BrowserGuard], pathMatch: 'full' },
  { path: 'submit', component: SubmitComponent, canActivate: [BrowserGuard], pathMatch: 'full' },
  { path: 'thanks', component: ThanksComponent },
  { path: 'datenschutz', component: PrivacyComponent },
  { path: 'privacy', redirectTo: 'datenschutz' },
  { path: '', component: SignupComponent },
  { path: '**', component: SignupComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }