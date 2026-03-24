import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, SessionData, SessionUser } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = '/api/public/auth';
  private readonly sessionStorageKey = 'cstar.auth.session';
  private readonly localStorageKey = 'cstar.auth.session.persist';

  private readonly sessionSubject = new BehaviorSubject<SessionData | null>(null);
  readonly session$ = this.sessionSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.restoreSession();
  }

  login(payload: LoginRequest, remember = false): Observable<SessionUser> {
    return this.http.post<AuthResponse>(`${this.apiBase}/login`, payload).pipe(
      tap((response) => this.persistSession(response, remember)),
      map((response) => this.toUser(response))
    );
  }

  register(payload: RegisterRequest, remember = false): Observable<SessionUser> {
    return this.http.post<AuthResponse>(`${this.apiBase}/register`, payload).pipe(
      tap((response) => this.persistSession(response, remember)),
      map((response) => this.toUser(response))
    );
  }

  logout(): void {
    this.clearStorage();
    this.sessionSubject.next(null);
  }

  getToken(): string | null {
    const session = this.sessionSubject.value;
    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.logout();
      return null;
    }

    return session.token;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  currentUser(): SessionUser | null {
    return this.sessionSubject.value?.user ?? null;
  }

  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions.includes(permission) ?? false;
  }

  hasRole(role: string): boolean {
    const roles = (this.currentUser()?.roles || []).map((item) => (item || '').trim().toUpperCase());
    return roles.includes((role || '').trim().toUpperCase());
  }

  hasAnyRole(roles: string[]): boolean {
    if (!roles || roles.length === 0) {
      return true;
    }

    const normalizedCurrentRoles = new Set((this.currentUser()?.roles || []).map((item) => (item || '').trim().toUpperCase()));
    return roles.some((role) => normalizedCurrentRoles.has((role || '').trim().toUpperCase()));
  }

  private persistSession(response: AuthResponse, remember: boolean): void {
    const session: SessionData = {
      token: response.accessToken,
      tokenType: response.tokenType,
      expiresAt: Date.now() + response.expiresInSeconds * 1000,
      user: this.toUser(response)
    };

    this.clearStorage();

    const serialized = JSON.stringify(session);
    if (remember) {
      localStorage.setItem(this.localStorageKey, serialized);
    } else {
      sessionStorage.setItem(this.sessionStorageKey, serialized);
    }

    this.sessionSubject.next(session);
  }

  private restoreSession(): void {
    const serialized = sessionStorage.getItem(this.sessionStorageKey) ?? localStorage.getItem(this.localStorageKey);
    if (!serialized) {
      return;
    }

    try {
      const session = JSON.parse(serialized) as SessionData;
      if (!session?.token || !session?.expiresAt || Date.now() > session.expiresAt) {
        this.clearStorage();
        return;
      }

      this.sessionSubject.next(session);
    } catch {
      this.clearStorage();
    }
  }

  private clearStorage(): void {
    sessionStorage.removeItem(this.sessionStorageKey);
    localStorage.removeItem(this.localStorageKey);
  }

  private toUser(response: AuthResponse): SessionUser {
    return {
      userId: response.userId,
      fullName: response.fullName,
      email: response.email,
      roles: response.roles,
      permissions: response.permissions
    };
  }
}
