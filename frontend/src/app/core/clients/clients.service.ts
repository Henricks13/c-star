import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ClientListItem, CreateClientRequest } from './clients.types';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private readonly apiBase = '/api/clients';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ClientListItem[]> {
    return this.http.get<ClientListItem[]>(this.apiBase);
  }

  create(payload: CreateClientRequest): Observable<ClientListItem> {
    return this.http.post<ClientListItem>(this.apiBase, payload);
  }
}
