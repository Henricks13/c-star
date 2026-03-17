import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateUserRequest, UpdateUserPasswordRequest, UpdateUserRequest, UserListItem } from './users.types';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiBase = '/api/users';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<UserListItem[]> {
    return this.http.get<UserListItem[]>(this.apiBase);
  }

  create(payload: CreateUserRequest): Observable<UserListItem> {
    return this.http.post<UserListItem>(this.apiBase, payload);
  }

  update(userId: string, payload: UpdateUserRequest): Observable<UserListItem> {
    return this.http.put<UserListItem>(`${this.apiBase}/${userId}`, payload);
  }

  updatePassword(userId: string, payload: UpdateUserPasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/${userId}/password`, payload);
  }
}
