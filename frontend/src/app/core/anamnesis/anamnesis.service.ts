import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AnamnesisQuestionItem,
  AnamnesisQuestionRequest,
  PublicAnamnesisForm,
  SubmitPublicAnamnesisRequest
} from './anamnesis.types';

@Injectable({
  providedIn: 'root'
})
export class AnamnesisService {
  private readonly apiBase = '/api/anamnesis';
  private readonly apiPublicBase = '/api/public/anamnesis';

  constructor(private readonly http: HttpClient) {}

  listQuestions(): Observable<AnamnesisQuestionItem[]> {
    return this.http.get<AnamnesisQuestionItem[]>(`${this.apiBase}/questions`);
  }

  createQuestion(payload: AnamnesisQuestionRequest): Observable<AnamnesisQuestionItem> {
    return this.http.post<AnamnesisQuestionItem>(`${this.apiBase}/questions`, payload);
  }

  updateQuestion(id: string, payload: AnamnesisQuestionRequest): Observable<AnamnesisQuestionItem> {
    return this.http.put<AnamnesisQuestionItem>(`${this.apiBase}/questions/${id}`, payload);
  }

  deleteQuestion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/questions/${id}`);
  }

  getPublicForm(clientId?: string | null, cpf?: string | null): Observable<PublicAnamnesisForm> {
    let params = new HttpParams();

    if (clientId) {
      params = params.set('clientId', clientId);
    }

    if (cpf) {
      params = params.set('cpf', cpf);
    }

    return this.http.get<PublicAnamnesisForm>(`${this.apiPublicBase}/form`, { params });
  }

  submitPublic(payload: SubmitPublicAnamnesisRequest): Observable<PublicAnamnesisForm> {
    return this.http.post<PublicAnamnesisForm>(`${this.apiPublicBase}/submit`, payload);
  }
}
