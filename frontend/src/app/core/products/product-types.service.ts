import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateProductTypeRequest, ProductTypeItem, UpdateProductTypeRequest } from './product-types.types';

@Injectable({
  providedIn: 'root'
})
export class ProductTypesService {
  private readonly apiBase = '/api/product-types';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ProductTypeItem[]> {
    return this.http.get<ProductTypeItem[]>(this.apiBase);
  }

  create(payload: CreateProductTypeRequest): Observable<ProductTypeItem> {
    return this.http.post<ProductTypeItem>(this.apiBase, payload);
  }

  update(id: string, payload: UpdateProductTypeRequest): Observable<ProductTypeItem> {
    return this.http.put<ProductTypeItem>(`${this.apiBase}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
