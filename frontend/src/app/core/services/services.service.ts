import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateServiceRequest, ServiceItem, UpdateServiceRequest } from './services.types';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private readonly apiBase = '/api/services';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ServiceItem[]> {
    return this.http.get<ServiceItem[]>(this.apiBase);
  }

  create(payload: CreateServiceRequest): Observable<ServiceItem> {
    return this.http.post<ServiceItem>(this.apiBase, payload);
  }

  update(id: string, payload: UpdateServiceRequest): Observable<ServiceItem> {
    return this.http.put<ServiceItem>(`${this.apiBase}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
