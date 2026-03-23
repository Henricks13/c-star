import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from 'src/app/core/notifications/notification.service';

@Component({
  selector: 'app-toast-notifications',
  imports: [CommonModule],
  template: `
    <div class="toast-layer" aria-live="polite" aria-atomic="true">
      @for (item of notifications(); track item.id) {
        <div class="toast-item" [ngClass]="toastClass(item.type)">
          <div class="toast-content">
            <strong class="toast-title">{{ icon(item.type) }} {{ label(item.type) }}</strong>
            <span class="toast-message">{{ item.message }}</span>
          </div>
          <button type="button" class="toast-close" (click)="dismiss(item.id)" aria-label="Fechar notificação">×</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-layer {
        position: fixed;
        top: 14px;
        right: 14px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: min(380px, calc(100vw - 20px));
        pointer-events: none;
      }

      .toast-item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        border-radius: 14px;
        border: 1px solid transparent;
        border-left-width: 4px;
        background: #fff;
        box-shadow: 0 8px 22px rgba(32, 42, 56, 0.12);
        padding: 11px 12px;
        pointer-events: auto;
        animation: toast-in 180ms ease-out;
      }

      .toast-content {
        display: flex;
        flex-direction: column;
      }

      .toast-title {
        font-size: 0.82rem;
        margin-bottom: 1px;
        letter-spacing: 0.01em;
      }

      .toast-message {
        font-size: 0.86rem;
        line-height: 1.35;
        color: #263238;
      }

      .toast-close {
        border: none;
        background: transparent;
        color: #78909c;
        line-height: 1;
        font-size: 1.2rem;
        padding: 0;
        cursor: pointer;
        margin-top: -1px;
      }

      .toast-success {
        border-color: #a7dcb1;
        border-left-color: #2e7d32;
        background: linear-gradient(135deg, #f4fbf5 0%, #ecf8ef 100%);
      }

      .toast-error {
        border-color: #efb0b0;
        border-left-color: #c62828;
        background: linear-gradient(135deg, #fff5f5 0%, #fff1f1 100%);
      }

      .toast-info {
        border-color: #cfdbe8;
        border-left-color: #8f6b10;
        background: linear-gradient(135deg, #fbf9f3 0%, #f7f2e7 100%);
      }

      .toast-warning {
        border-color: #ecd193;
        border-left-color: #b88a1e;
        background: linear-gradient(135deg, #fffaf0 0%, #fff5e5 100%);
      }

      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(-6px) scale(0.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (max-width: 576px) {
        .toast-layer {
          top: 8px;
          right: 8px;
          width: calc(100vw - 12px);
          gap: 8px;
        }

        .toast-item {
          padding: 10px 10px;
          border-radius: 12px;
        }

        .toast-title {
          font-size: 0.8rem;
        }

        .toast-message {
          font-size: 0.84rem;
        }
      }
    `
  ]
})
export class ToastNotificationsComponent implements AfterViewInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private observer?: MutationObserver;
  private readonly cooldownByMessage = new Map<string, number>();
  notifications = this.notificationService.notifications;

  ngAfterViewInit(): void {
    this.bridgeExistingAlerts();
    this.startAlertObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  dismiss(id: string): void {
    this.notificationService.remove(id);
  }

  toastClass(type: 'success' | 'error' | 'info' | 'warning'): string {
    return `toast-${type}`;
  }

  label(type: 'success' | 'error' | 'info' | 'warning'): string {
    if (type === 'success') {
      return 'Sucesso';
    }
    if (type === 'error') {
      return 'Erro';
    }
    if (type === 'warning') {
      return 'Aviso';
    }
    return 'Informação';
  }

  icon(type: 'success' | 'error' | 'info' | 'warning'): string {
    if (type === 'success') {
      return '✓';
    }
    if (type === 'error') {
      return '⨯';
    }
    if (type === 'warning') {
      return '⚠';
    }
    return 'ℹ';
  }

  private startAlertObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') {
          continue;
        }

        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          }

          this.bridgeAlertNode(node);
          node.querySelectorAll?.('.alert[role="alert"]').forEach((nested) => {
            if (nested instanceof HTMLElement) {
              this.bridgeAlertElement(nested);
            }
          });
        });
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private bridgeExistingAlerts(): void {
    document.querySelectorAll<HTMLElement>('.alert[role="alert"]').forEach((element) => {
      this.bridgeAlertElement(element);
    });
  }

  private bridgeAlertNode(node: HTMLElement): void {
    if (node.matches('.alert[role="alert"]')) {
      this.bridgeAlertElement(node);
    }
  }

  private bridgeAlertElement(element: HTMLElement): void {
    if (element.dataset['toastBridged'] === 'true') {
      return;
    }

    const message = (element.textContent || '').replace(/\s+/g, ' ').trim();
    if (!message) {
      return;
    }

    const type = this.resolveType(element);
    const key = `${type}:${message}`;
    const now = Date.now();
    const previousTime = this.cooldownByMessage.get(key) || 0;
    if (now - previousTime < 800) {
      element.dataset['toastBridged'] = 'true';
      return;
    }

    this.cooldownByMessage.set(key, now);
    if (this.cooldownByMessage.size > 80) {
      const staleLimit = now - 60_000;
      [...this.cooldownByMessage.entries()]
        .filter(([, value]) => value < staleLimit)
        .forEach(([k]) => this.cooldownByMessage.delete(k));
    }

    if (type === 'success') {
      this.notificationService.success(message);
    } else if (type === 'error') {
      this.notificationService.error(message);
    } else if (type === 'warning') {
      this.notificationService.warning(message);
    } else {
      this.notificationService.info(message);
    }

    element.dataset['toastBridged'] = 'true';
  }

  private resolveType(element: HTMLElement): 'success' | 'error' | 'info' | 'warning' {
    const text = (element.textContent || '').toLowerCase();

    if (element.classList.contains('alert-success')) {
      return 'success';
    }
    if (element.classList.contains('alert-danger')) {
      return 'error';
    }
    if (element.classList.contains('alert-warning')) {
      return 'warning';
    }

    if (/(sucesso|sucess|concluíd|removid|atualizad|cadastrad|ativad|desativad|enviad|salv)/.test(text)) {
      return 'success';
    }

    if (/(erro|falha|não foi possível|nao foi possivel|inválid|invalido|obrigatóri)/.test(text)) {
      return 'error';
    }

    return 'info';
  }
}
