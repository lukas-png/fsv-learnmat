import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { BrowserGuard } from './browser.guard';

describe('BrowserGuard', () => {
  const auth = { validate: jest.fn() };
  let guard: BrowserGuard;
  let router: Router;

  beforeEach(() => {
    auth.validate.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    guard = TestBed.inject(BrowserGuard);
    router = TestBed.inject(Router);
  });

  const activate = async (token?: string) => {
    const route = { queryParamMap: convertToParamMap(token ? { token } : {}) } as ActivatedRouteSnapshot;
    const result = guard.canActivate(route, {} as RouterStateSnapshot);
    const value = result instanceof Observable ? await firstValueFrom(result) : result;
    return value instanceof UrlTree ? router.serializeUrl(value) : value;
  };

  it('lets a valid token through', async () => {
    auth.validate.mockReturnValue(of(new HttpResponse({ status: 200 })));
    expect(await activate('abc')).toBe(true);
  });

  it('sends visitors without a token to the signup page', async () => {
    expect(await activate()).toBe('/');
    expect(auth.validate).not.toHaveBeenCalled();
  });

  it('tells the signup page that the link has expired', async () => {
    auth.validate.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Expired' } })));
    expect(await activate('abc')).toBe('/?link=expired');
  });

  it('tells the signup page that the link is invalid', async () => {
    auth.validate.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Not valid' } })));
    expect(await activate('abc')).toBe('/?link=invalid');
  });

  it('shows no link notice when the server is unreachable', async () => {
    auth.validate.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    expect(await activate('abc')).toBe('/');
  });
});
