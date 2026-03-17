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
          <div class="top-actions mb-3">
            <button class="btn btn-sm btn-outline-primary" type="button" [disabled]="loading || connecting" (click)="refreshStatus()">
              Atualizar status
            </button>
          </div>

          @if (errorMessage) {
            <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
          }

          @if (infoMessage) {
            <div class="alert alert-info" role="alert">{{ infoMessage }}</div>
          }

          @if (loading) {
            <p class="mb-0">Carregando status da sessão...</p>
          } @else if (session?.connected) {
            <div class="status-card status-connected mb-3">
              <div class="session-header mb-3">
                <img
                  class="profile-photo"
                  [src]="session?.profilePicUrl || 'assets/images/user/avatar-2.jpg'"
                  alt="Foto do perfil conectado"
                />
                <div>
                  <h6 class="mb-1">WhatsApp conectado</h6>
                  <p class="mb-0 text-muted">Conectado e pronto para envio/recebimento de mensagens.</p>
                </div>
              </div>

              <h6 class="mb-2">Sessão conectada</h6>
              <div class="session-info-grid">
                <div class="session-info-item">
                  <span class="session-label">Nome</span>
                  <span>{{ session?.displayName || 'Não informado' }}</span>
                </div>
                <div class="session-info-item">
                  <span class="session-label">Número</span>
                  <span>{{ session?.phoneNumber || 'Não informado' }}</span>
                </div>
                <div class="session-info-item">
                  <span class="session-label">Provider</span>
                  <span>{{ session?.provider || 'Não informado' }}</span>
                </div>
                <div class="session-info-item">
                  <span class="session-label">Última sincronização</span>
                  <span>{{ session?.lastSyncAt || 'Não informada' }}</span>
                </div>
              </div>
            </div>

            <div class="whatsapp-actions">
              <button class="btn btn-sm btn-outline-danger" type="button" [disabled]="connecting" (click)="openDisconnectConfirm()">
                Desconectar
              </button>
            </div>
          } @else {
            <div class="status-card status-disconnected mb-3">
              <h6 class="mb-2">Sessão desconectada</h6>
              <p class="mb-0">Gere o QR Code e escaneie pelo WhatsApp para conectar este número ao sistema.</p>
            </div>

            <div class="whatsapp-actions mb-3">
              <button class="btn btn-sm btn-success" type="button" [disabled]="connecting" (click)="requestQrCode()">
                Gerar/Atualizar QR Code
              </button>
              <button class="btn btn-sm btn-outline-success" type="button" [disabled]="connecting" (click)="connectSession()">
                Confirmar conexão
              </button>
              <button class="btn btn-sm btn-outline-danger" type="button" [disabled]="connecting" (click)="openDisconnectConfirm()">
                Desconectar sessão
              </button>
            </div>

            @if (qrCodeDataUrl) {
              <div class="qr-wrapper">
                <img [src]="qrCodeDataUrl" alt="QR Code do WhatsApp" />
              </div>
            } @else {
              <p class="text-muted mb-0">Se o QR ainda não aparecer, aguarde alguns segundos e clique em "Gerar/Atualizar QR Code".</p>
            }
          }

          @if (confirmDisconnectOpen) {
            <div class="disconnect-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="disconnect-title">
              <div class="disconnect-modal">
                <h6 id="disconnect-title" class="mb-2">Confirmar desconexão</h6>
                <p class="mb-3">Deseja mesmo desconectar este WhatsApp? Para reconectar, será necessário gerar e escanear um novo QR Code.</p>
                <div class="disconnect-modal-actions d-flex justify-content-end gap-2">
                  <button class="btn btn-outline-secondary" type="button" [disabled]="connecting" (click)="closeDisconnectConfirm()">Cancelar</button>
                  <button class="btn btn-danger" type="button" [disabled]="connecting" (click)="confirmDisconnectSession()">Desconectar</button>
                </div>
              </div>
            </div>
          }
        </app-card>
      </div>
    </div>
  `,
  styles: [
    `
      .top-actions {
        display: flex;
        justify-content: flex-start;
      }

      .status-card {
        border: 1px solid var(--bs-border-color);
        border-radius: 8px;
        padding: 12px;
      }

      .session-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .session-info-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.6rem;
      }

      .session-info-item {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .session-info-item span:last-child,
      .session-header p {
        overflow-wrap: anywhere;
      }

      .session-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--bs-secondary-color);
      }

      .whatsapp-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
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

      .profile-photo {
        width: 56px;
        height: 56px;
        border-radius: 999px;
        object-fit: cover;
        border: 1px solid var(--bs-border-color);
      }

      .disconnect-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1060;
        padding: 16px;
      }

      .disconnect-modal {
        background: var(--bs-body-bg);
        border: 1px solid var(--bs-border-color);
        border-radius: 10px;
        max-width: 480px;
        width: 100%;
        padding: 16px;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
      }

      @media (max-width: 768px) {
        .top-actions .btn {
          width: 100%;
        }

        .session-header {
          align-items: flex-start;
        }

        .session-info-grid {
          grid-template-columns: 1fr;
        }

        .whatsapp-actions {
          flex-direction: column;
        }

        .whatsapp-actions .btn {
          width: 100%;
          justify-content: center;
        }

        .disconnect-modal {
          padding: 12px;
        }

        .disconnect-modal-actions {
          justify-content: stretch !important;
          flex-wrap: wrap;
        }

        .disconnect-modal-actions .btn {
          width: 100%;
        }

        .qr-wrapper {
          display: flex;
          width: 100%;
          justify-content: center;
        }

        .qr-wrapper img {
          max-width: 220px;
        }
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
  infoMessage: string | null = null;
  confirmDisconnectOpen = false;

  constructor(private readonly whatsappService: WhatsappService) {}

  ngOnInit(): void {
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.loading = true;
    this.errorMessage = null;
    this.infoMessage = null;

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
    this.infoMessage = null;

    this.whatsappService.generateQrCode().subscribe({
      next: (response) => {
        const rawQr = (response.qrCodeBase64 ?? '').trim();
        if (!rawQr) {
          this.whatsappService.getSessionStatus().subscribe({
            next: (session) => {
              this.session = session;
              this.qrCodeDataUrl = null;
              if (session.connected) {
                this.infoMessage = `Este WhatsApp já está conectado${session.phoneNumber ? ` (${session.phoneNumber})` : ''}. Para gerar novo QR, desconecte primeiro.`;
              } else {
                this.errorMessage = 'A Evolution ainda não retornou o QR Code. Tente novamente em alguns segundos.';
              }
              this.connecting = false;
            },
            error: () => {
              this.qrCodeDataUrl = null;
              this.errorMessage = 'A Evolution ainda não retornou o QR Code. Tente novamente em alguns segundos.';
              this.connecting = false;
            }
          });
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
    this.infoMessage = null;

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

  openDisconnectConfirm(): void {
    if (this.connecting) {
      return;
    }
    this.confirmDisconnectOpen = true;
  }

  closeDisconnectConfirm(): void {
    this.confirmDisconnectOpen = false;
  }

  confirmDisconnectSession(): void {
    this.confirmDisconnectOpen = false;
    this.disconnectSession();
  }

  disconnectSession(): void {
    this.connecting = true;
    this.errorMessage = null;
    this.infoMessage = null;
    this.confirmDisconnectOpen = false;

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
