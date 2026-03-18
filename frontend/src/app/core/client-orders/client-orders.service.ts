import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ClientServiceOrderItem,
  ConfirmClientServiceOrderPaymentRequest,
  CreateClientServiceOrderRequest
} from './client-orders.types';

@Injectable({
  providedIn: 'root'
})
export class ClientOrdersService {
  constructor(private readonly http: HttpClient) {}

  create(payload: CreateClientServiceOrderRequest): Observable<ClientServiceOrderItem> {
    return this.http.post<ClientServiceOrderItem>('/api/client-service-orders', payload);
  }

  findPendingByClient(clientId: string): Observable<ClientServiceOrderItem | null> {
    return this.http.get<ClientServiceOrderItem | null>(`/api/clients/${clientId}/service-orders/pending`);
  }

  confirmPayment(orderId: string, payload: ConfirmClientServiceOrderPaymentRequest): Observable<ClientServiceOrderItem> {
    return this.http.post<ClientServiceOrderItem>(`/api/client-service-orders/${orderId}/payment`, payload);
  }

  listByClient(clientId: string): Observable<ClientServiceOrderItem[]> {
    return this.http.get<ClientServiceOrderItem[]>(`/api/clients/${clientId}/service-orders`);
  }
}
