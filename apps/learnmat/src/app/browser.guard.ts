import { Injectable, inject } from '@angular/core';
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

      // An invalid token is answered with 401, which arrives as an error, not as a response
      return this.auth.validate(token).pipe(
        map(resp => resp.status == 200 ? true : this.router.parseUrl('/')),
        catchError(() => of(this.router.parseUrl('/'))),
      );
  }
  
}
