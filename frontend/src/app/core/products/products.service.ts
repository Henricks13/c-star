import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreateProductRequest, ProductItem, UpdateProductRequest } from './products.types';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly apiBase = '/api/products';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ProductItem[]> {
    return this.http.get<ProductItem[]>(this.apiBase);
  }

  create(payload: CreateProductRequest): Observable<ProductItem> {
    return this.http.post<ProductItem>(this.apiBase, payload);
  }

  update(id: string, payload: UpdateProductRequest): Observable<ProductItem> {
    return this.http.put<ProductItem>(`${this.apiBase}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
