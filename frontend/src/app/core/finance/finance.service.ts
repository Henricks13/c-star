import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  FinanceExpenseItem,
  FinanceExpenseRequest,
  FinanceIncomeItem,
  FinanceIncomeRequest,
  FinanceTypeItem,
  FinanceTypeRequest,
  FinanceReport,
  ProductSale,
  ProductSaleRequest
} from './finance.types';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly apiBase = '/api/finance';

  constructor(private readonly http: HttpClient) {}

  listIncomeTypes(): Observable<FinanceTypeItem[]> {
    return this.http.get<FinanceTypeItem[]>(`${this.apiBase}/income-types`);
  }

  createIncomeType(payload: FinanceTypeRequest): Observable<FinanceTypeItem> {
    return this.http.post<FinanceTypeItem>(`${this.apiBase}/income-types`, payload);
  }

  updateIncomeType(id: string, payload: FinanceTypeRequest): Observable<FinanceTypeItem> {
    return this.http.put<FinanceTypeItem>(`${this.apiBase}/income-types/${id}`, payload);
  }

  deleteIncomeType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/income-types/${id}`);
  }

  listExpenseTypes(): Observable<FinanceTypeItem[]> {
    return this.http.get<FinanceTypeItem[]>(`${this.apiBase}/expense-types`);
  }

  createExpenseType(payload: FinanceTypeRequest): Observable<FinanceTypeItem> {
    return this.http.post<FinanceTypeItem>(`${this.apiBase}/expense-types`, payload);
  }

  updateExpenseType(id: string, payload: FinanceTypeRequest): Observable<FinanceTypeItem> {
    return this.http.put<FinanceTypeItem>(`${this.apiBase}/expense-types/${id}`, payload);
  }

  deleteExpenseType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/expense-types/${id}`);
  }

  listIncomes(): Observable<FinanceIncomeItem[]> {
    return this.http.get<FinanceIncomeItem[]>(`${this.apiBase}/incomes`);
  }

  listServiceOrderIncomes(orderId: string): Observable<FinanceIncomeItem[]> {
    return this.http.get<FinanceIncomeItem[]>(`${this.apiBase}/incomes/service-order/${orderId}`);
  }

  createIncome(payload: FinanceIncomeRequest): Observable<FinanceIncomeItem> {
    return this.http.post<FinanceIncomeItem>(`${this.apiBase}/incomes`, payload);
  }

  updateIncome(id: string, payload: FinanceIncomeRequest): Observable<FinanceIncomeItem> {
    return this.http.put<FinanceIncomeItem>(`${this.apiBase}/incomes/${id}`, payload);
  }

  confirmIncomePayment(id: string): Observable<FinanceIncomeItem> {
    return this.http.post<FinanceIncomeItem>(`${this.apiBase}/incomes/${id}/confirm-payment`, {});
  }

  updateIncomeNotes(id: string, notes: string | null): Observable<FinanceIncomeItem> {
    return this.http.put<FinanceIncomeItem>(`${this.apiBase}/incomes/${id}/notes`, { notes });
  }

  deleteIncome(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/incomes/${id}`);
  }

  deleteServiceOrderWithIncomes(orderId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/incomes/service-order/${orderId}`);
  }

  listExpenses(): Observable<FinanceExpenseItem[]> {
    return this.http.get<FinanceExpenseItem[]>(`${this.apiBase}/expenses`);
  }

  createExpense(payload: FinanceExpenseRequest): Observable<FinanceExpenseItem> {
    return this.http.post<FinanceExpenseItem>(`${this.apiBase}/expenses`, payload);
  }

  updateExpense(id: string, payload: FinanceExpenseRequest): Observable<FinanceExpenseItem> {
    return this.http.put<FinanceExpenseItem>(`${this.apiBase}/expenses/${id}`, payload);
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/expenses/${id}`);
  }

  listProductSales(): Observable<ProductSale[]> {
    return this.http.get<ProductSale[]>(`${this.apiBase}/product-sales`);
  }

  createProductSale(payload: ProductSaleRequest): Observable<ProductSale> {
    return this.http.post<ProductSale>(`${this.apiBase}/product-sales`, payload);
  }

  getReport(startDate?: string | null, endDate?: string | null): Observable<FinanceReport> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http.get<FinanceReport>(`${this.apiBase}/report`, { params });
  }
}
