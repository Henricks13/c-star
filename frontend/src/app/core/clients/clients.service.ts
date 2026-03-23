import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AddClientObservationRequest, ClientListItem, ClientObservationItem, CreateClientRequest } from './clients.types';

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

  delete(clientId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${clientId}`);
  }

  listObservations(clientId: string): Observable<ClientObservationItem[]> {
    return this.http.get<ClientObservationItem[]>(`${this.apiBase}/${clientId}/observations`);
  }

  addObservation(clientId: string, payload: AddClientObservationRequest): Observable<ClientObservationItem> {
    return this.http.post<ClientObservationItem>(`${this.apiBase}/${clientId}/observations`, payload);
  }
}
