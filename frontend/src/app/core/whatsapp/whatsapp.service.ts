import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { WhatsappQrCodeResponse, WhatsappSessionInfo } from './whatsapp.types';

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  private readonly apiBase = '/api/whatsapp';

  constructor(private readonly http: HttpClient) {}

  getSessionStatus(): Observable<WhatsappSessionInfo> {
    return this.http.get<WhatsappSessionInfo>(`${this.apiBase}/session`);
  }

  generateQrCode(): Observable<WhatsappQrCodeResponse> {
    return this.http.post<WhatsappQrCodeResponse>(`${this.apiBase}/session/qr-code`, {});
  }

  connect(): Observable<WhatsappSessionInfo> {
    return this.http.post<WhatsappSessionInfo>(`${this.apiBase}/session/connect`, {});
  }

  disconnect(): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/session/disconnect`, {});
  }
}
