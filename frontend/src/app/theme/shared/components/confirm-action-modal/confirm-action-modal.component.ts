import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-action-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-action-modal.component.html',
  styleUrls: ['./confirm-action-modal.component.scss']
})
export class ConfirmActionModalComponent {
  @Input() open = false;
  @Input() title = 'Confirmar ação';
  @Input() subtitle = '';
  @Input() bodyText = '';
  @Input() highlightText: string | null = null;
  @Input() bodySuffix = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() loading = false;
  @Input() loadingLabel = 'Processando...';

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onBackdropClick(): void {
    if (this.loading) {
      return;
    }
    this.cancel.emit();
  }

  onCancel(): void {
    if (this.loading) {
      return;
    }
    this.cancel.emit();
  }

  onConfirm(): void {
    if (this.loading) {
      return;
    }
    this.confirm.emit();
  }
}
