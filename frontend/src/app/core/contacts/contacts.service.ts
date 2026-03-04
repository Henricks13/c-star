import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ContactView } from './contacts.types';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {
  private readonly apiBase = '/api/contacts';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ContactView[]> {
    return this.http.get<ContactView[]>(this.apiBase);
  }
}
