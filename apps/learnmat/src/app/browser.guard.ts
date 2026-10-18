import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BrowserGuard implements CanActivate {
  private router = inject(Router);
  private auth = inject(AuthService);


  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree {
      
      const token = route.queryParamMap.get('token') || "";
      if (token === null || token === '') {
        return this.router.parseUrl('/'); 
      }

      // An invalid token is answered with 401, which arrives as an error, not as a response.
      // The signup page then explains why the link did not work.
      return this.auth.validate(token).pipe(
        map(resp => resp.status == 200 ? true : this.router.parseUrl('/')),
        catchError((error: unknown) => {
          if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
            return of(this.router.parseUrl('/'));
          }
          const reason = error.error?.message === 'Expired' ? 'expired' : 'invalid';
          return of(this.router.createUrlTree(['/'], { queryParams: { link: reason } }));
        }),
      );
  }
  
}
