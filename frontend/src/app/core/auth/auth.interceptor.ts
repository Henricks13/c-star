import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const isPublicAuthRoute = req.url.includes('/api/public/auth/');

    const authReq = token && !isPublicAuthRoute
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (isPublicAuthRoute) {
          return throwError(() => error);
        }

        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }

        if (error.status === 403 && this.authService.isAuthenticated()) {
          this.router.navigate(['/access-denied']);
        }

        return throwError(() => error);
      })
    );
  }
}
