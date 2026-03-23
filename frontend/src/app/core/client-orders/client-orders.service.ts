import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AddClientServiceOrderObservationRequest,
  ClientServiceOrderItem,
  ConfirmClientServiceOrderPaymentRequest,
  CreateClientServiceOrderPaymentPlanRequest,
  CreateClientServiceOrderRequest,
  ScheduleClientServiceOrderRequest,
  ScheduleClientServiceOrderReturnRequest
} from './client-orders.types';

@Injectable({
  providedIn: 'root'
})
export class ClientOrdersService {
  constructor(private readonly http: HttpClient) {}

  listAll(): Observable<ClientServiceOrderItem[]> {
    return this.http.get<ClientServiceOrderItem[]>('/api/client-service-orders');
  }

  create(payload: CreateClientServiceOrderRequest): Observable<ClientServiceOrderItem> {
    return this.http.post<ClientServiceOrderItem>('/api/client-service-orders', payload);
  }

  findPendingByClient(clientId: string): Observable<ClientServiceOrderItem | null> {
    return this.http.get<ClientServiceOrderItem | null>(`/api/clients/${clientId}/service-orders/pending`);
  }

  confirmPayment(orderId: string, payload: ConfirmClientServiceOrderPaymentRequest): Observable<ClientServiceOrderItem> {
    return this.http.post<ClientServiceOrderItem>(`/api/client-service-orders/${orderId}/payment`, payload);
  }

  createPaymentPlan(orderId: string, payload: CreateClientServiceOrderPaymentPlanRequest): Observable<ClientServiceOrderItem> {
    return this.http.post<ClientServiceOrderItem>(`/api/client-service-orders/${orderId}/payment-plan`, payload);
  }

  scheduleService(orderId: string, payload: ScheduleClientServiceOrderRequest): Observable<ClientServiceOrderItem> {
    return this.http.post<ClientServiceOrderItem>(`/api/client-service-orders/${orderId}/schedule`, payload);
  }

  addObservation(orderId: string, payload: AddClientServiceOrderObservationRequest): Observable<ClientServiceOrderItem> {
    return this.http.post<ClientServiceOrderItem>(`/api/client-service-orders/${orderId}/observations`, payload);
  }

  scheduleReturn(orderId: string, payload: ScheduleClientServiceOrderReturnRequest): Observable<ClientServiceOrderItem> {
    return this.http.post<ClientServiceOrderItem>(`/api/client-service-orders/${orderId}/returns`, payload);
  }

  finalizeService(orderId: string): Observable<ClientServiceOrderItem> {
    return this.http.post<ClientServiceOrderItem>(`/api/client-service-orders/${orderId}/finalize`, {});
  }

  listByClient(clientId: string): Observable<ClientServiceOrderItem[]> {
    return this.http.get<ClientServiceOrderItem[]>(`/api/clients/${clientId}/service-orders`);
  }
}
