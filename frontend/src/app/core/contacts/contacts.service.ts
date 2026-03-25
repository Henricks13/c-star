import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ContactMessage, ContactPageResponse, ContactResetResponse, ContactSyncResponse, ContactView } from './contacts.types';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {
  private readonly apiBase = '/api/contacts';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ContactView[]> {
    return this.http.get<ContactView[]>(this.apiBase);
  }

  listPaged(page: number, size: number, view = 'geral', stage?: string, period?: string, query?: string): Observable<ContactPageResponse> {
    const params: Record<string, string | number> = { page, size, view };
    if (stage && stage !== 'ALL') {
      params['stage'] = stage;
    }
    if (period && period !== 'ALL') {
      params['period'] = period;
    }
    if (query && query.trim()) {
      params['query'] = query.trim();
    }

    return this.http.get<ContactPageResponse>(`${this.apiBase}/paged`, {
      params
    });
  }

  syncAll(): Observable<ContactSyncResponse> {
    return this.http.post<ContactSyncResponse>(`${this.apiBase}/sync`, {});
  }

  resetAll(): Observable<ContactResetResponse> {
    return this.http.post<ContactResetResponse>(`${this.apiBase}/reset-all`, {});
  }

  getMessages(contactId: string, limit = 20): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(`${this.apiBase}/${contactId}/messages`, {
      params: { limit }
    });
  }

  markAsRescuing(contactId: string): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/${contactId}/rescue-start`, {});
  }
}
