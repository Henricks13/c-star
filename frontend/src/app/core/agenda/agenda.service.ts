import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AgendaEventItem, AgendaEventTypeItem, CreateAgendaEventRequest } from './agenda.types';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  private readonly apiBase = '/api/agenda';

  constructor(private readonly http: HttpClient) {}

  listTypes(): Observable<AgendaEventTypeItem[]> {
    return this.http.get<AgendaEventTypeItem[]>(`${this.apiBase}/types`);
  }

  listEvents(start: string, end: string): Observable<AgendaEventItem[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<AgendaEventItem[]>(`${this.apiBase}/events`, { params });
  }

  createEvent(payload: CreateAgendaEventRequest): Observable<AgendaEventItem> {
    return this.http.post<AgendaEventItem>(`${this.apiBase}/events`, payload);
  }

  findEventById(eventId: string): Observable<AgendaEventItem> {
    return this.http.get<AgendaEventItem>(`${this.apiBase}/events/${eventId}`);
  }
}
