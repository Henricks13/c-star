import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { WhatsappService } from 'src/app/core/whatsapp/whatsapp.service';
import { WhatsappSessionInfo } from 'src/app/core/whatsapp/whatsapp.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-whatsapp',
  imports: [CommonModule, CardComponent],
  template: `
    <div class="row">
      <div class="col-sm-12">
        <app-card cardTitle="WhatsApp">
          <div class="d-flex gap-2 mb-3">
            <button class="btn btn-outline-primary" type="button" [disabled]="loading || connecting" (click)="refreshStatus()">
              Atualizar status
            </button>
          </div>

          @if (errorMessage) {
            <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
          }

          @if (loading) {
            <p class="mb-0">Carregando status da sessão...</p>
          } @else if (session?.connected) {
            <div class="status-card status-connected mb-3">
              <h6 class="mb-2">Sessão conectada</h6>
              <p class="mb-1"><strong>Nome:</strong> {{ session?.displayName || 'Não informado' }}</p>
              <p class="mb-1"><strong>Número:</strong> {{ session?.phoneNumber || 'Não informado' }}</p>
              <p class="mb-1"><strong>Provider:</strong> {{ session?.provider || 'Não informado' }}</p>
              <p class="mb-0"><strong>Última sincronização:</strong> {{ session?.lastSyncAt || 'Não informada' }}</p>
            </div>

            <button class="btn btn-outline-danger" type="button" [disabled]="connecting" (click)="disconnectSession()">Desconectar</button>
          } @else {
            <div class="status-card status-disconnected mb-3">
              <h6 class="mb-2">Sessão desconectada</h6>
              <p class="mb-0">Gere o QR Code e escaneie pelo WhatsApp para conectar este número ao sistema.</p>
            </div>

            <div class="d-flex gap-2 flex-wrap mb-3">
              <button class="btn btn-success" type="button" [disabled]="connecting" (click)="requestQrCode()">Gerar/Atualizar QR Code</button>
              <button class="btn btn-outline-success" type="button" [disabled]="connecting" (click)="connectSession()">Confirmar conexão</button>
            </div>

            @if (qrCodeDataUrl) {
              <div class="qr-wrapper">
                <img [src]="qrCodeDataUrl" alt="QR Code do WhatsApp" />
              </div>
            } @else {
              <p class="text-muted mb-0">Se o QR ainda não aparecer, aguarde alguns segundos e clique em "Gerar/Atualizar QR Code".</p>
            }
          }
        </app-card>
      </div>
    </div>
  `,
  styles: [
    `
      .status-card {
        border: 1px solid var(--bs-border-color);
        border-radius: 8px;
        padding: 12px;
      }

      .status-connected {
        border-left: 4px solid var(--bs-success);
      }

      .status-disconnected {
        border-left: 4px solid var(--bs-warning);
      }

      .qr-wrapper {
        border: 1px dashed var(--bs-border-color);
        border-radius: 8px;
        display: inline-flex;
        padding: 12px;
      }

      .qr-wrapper img {
        display: block;
        max-width: 240px;
        width: 100%;
        height: auto;
      }
    `
  ]
})
export class WhatsappComponent implements OnInit {
  loading = false;
  connecting = false;
  session: WhatsappSessionInfo | null = null;
  qrCodeDataUrl: string | null = null;
  errorMessage: string | null = null;

  constructor(private readonly whatsappService: WhatsappService) {}

  ngOnInit(): void {
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.loading = true;
    this.errorMessage = null;

    this.whatsappService.getSessionStatus().subscribe({
      next: (session) => {
        this.session = session;
        if (session.connected) {
          this.qrCodeDataUrl = null;
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível consultar o status do WhatsApp.';
        this.loading = false;
      }
    });
  }

  requestQrCode(): void {
    this.connecting = true;
    this.errorMessage = null;

    this.whatsappService.generateQrCode().subscribe({
      next: (response) => {
        const rawQr = (response.qrCodeBase64 ?? '').trim();
        if (!rawQr) {
          this.qrCodeDataUrl = null;
          this.errorMessage = 'A Evolution ainda não retornou o QR Code. Tente novamente em alguns segundos.';
          this.connecting = false;
          return;
        }

        this.qrCodeDataUrl = rawQr.startsWith('data:') ? rawQr : `data:image/png;base64,${rawQr}`;
        this.connecting = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível gerar o QR Code agora.';
        this.connecting = false;
      }
    });
  }

  connectSession(): void {
    this.connecting = true;
    this.errorMessage = null;

    this.whatsappService.connect().subscribe({
      next: (session) => {
        this.session = session;
        if (session.connected) {
          this.qrCodeDataUrl = null;
        }
        this.connecting = false;
      },
      error: () => {
        this.errorMessage = 'Falha ao conectar sessão do WhatsApp.';
        this.connecting = false;
      }
    });
  }

  disconnectSession(): void {
    this.connecting = true;
    this.errorMessage = null;

    this.whatsappService.disconnect().subscribe({
      next: () => {
        this.session = { connected: false };
        this.qrCodeDataUrl = null;
        this.connecting = false;
      },
      error: () => {
        this.errorMessage = 'Falha ao desconectar sessão do WhatsApp.';
        this.connecting = false;
      }
    });
  }
}
