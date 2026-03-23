import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  createdAt: number;
  durationMs: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<NotificationItem[]>([]);

  success(message: string, durationMs = 4000): void {
    this.push('success', message, durationMs);
  }

  error(message: string, durationMs = 5500): void {
    this.push('error', message, durationMs);
  }

  info(message: string, durationMs = 4500): void {
    this.push('info', message, durationMs);
  }

  warning(message: string, durationMs = 5000): void {
    this.push('warning', message, durationMs);
  }

  remove(id: string): void {
    this.notifications.update((items) => items.filter((item) => item.id !== id));
  }

  private push(type: NotificationType, message: string, durationMs: number): void {
    const trimmedMessage = (message || '').trim();
    if (!trimmedMessage) {
      return;
    }

    const item: NotificationItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      message: trimmedMessage,
      type,
      createdAt: Date.now(),
      durationMs
    };

    this.notifications.update((items) => [...items, item]);
    window.setTimeout(() => this.remove(item.id), durationMs);
  }
}
