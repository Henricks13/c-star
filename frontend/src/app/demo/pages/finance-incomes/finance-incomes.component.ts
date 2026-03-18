import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinanceService } from 'src/app/core/finance/finance.service';
import {
  FinanceIncomeItem,
  FinanceIncomePaymentStatus,
  FinanceIncomeRequest,
  FinanceTypeItem
} from 'src/app/core/finance/finance.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-finance-incomes',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './finance-incomes.component.html',
  styleUrls: ['./finance-incomes.component.scss']
})
export class FinanceIncomesComponent implements OnInit {
  loading = false;
  saving = false;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  incomes: FinanceIncomeItem[] = [];
  incomeTypes: FinanceTypeItem[] = [];
  selectedIncome: FinanceIncomeItem | null = null;

  createModalOpen = false;
  editModalOpen = false;
  confirmPaymentModalOpen = false;
  confirmDeleteModalOpen = false;

  createForm: FinanceIncomeRequest = this.defaultForm();
  editForm: FinanceIncomeRequest = this.defaultForm();

  constructor(private readonly financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = null;

    this.financeService.listIncomeTypes().subscribe({
      next: (types) => {
        this.incomeTypes = types;
        this.financeService.listIncomes().subscribe({
          next: (items) => {
            this.incomes = items;
            this.loading = false;
          },
          error: () => {
            this.errorMessage = 'Não foi possível carregar as receitas.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os tipos de receita.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    if (this.incomeTypes.length === 0) {
      this.errorMessage = 'Cadastre ao menos um tipo de receita antes de lançar receitas.';
      return;
    }

    this.createForm = this.defaultForm();
    this.createForm.incomeTypeId = this.incomeTypes[0]?.id || '';
    this.errorMessage = null;
    this.infoMessage = null;
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  createIncome(): void {
    if (this.saving) {
      return;
    }

    const payload = this.normalizePayload(this.createForm);
    if (!payload) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.financeService.createIncome(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeCreateModal();
        this.infoMessage = 'Receita lançada com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível lançar a receita.';
        this.saving = false;
      }
    });
  }

  openEditModal(income: FinanceIncomeItem): void {
    this.selectedIncome = income;
    this.editForm = {
      incomeTypeId: income.incomeTypeId,
      source: income.source,
      referenceId: income.referenceId,
      amount: income.amount,
      description: income.description || '',
      notes: income.notes || '',
      occurredOn: income.occurredOn
    };
    this.errorMessage = null;
    this.infoMessage = null;
    this.editModalOpen = true;
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.selectedIncome = null;
  }

  updateIncome(): void {
    if (!this.selectedIncome || this.saving) {
      return;
    }

    const payload = this.normalizePayload(this.editForm);
    if (!payload) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.financeService.updateIncome(this.selectedIncome.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.infoMessage = 'Receita atualizada com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível atualizar a receita.';
        this.saving = false;
      }
    });
  }

  openConfirmPaymentModal(income: FinanceIncomeItem): void {
    this.selectedIncome = income;
    this.errorMessage = null;
    this.infoMessage = null;
    this.confirmPaymentModalOpen = true;
  }

  closeConfirmPaymentModal(): void {
    this.confirmPaymentModalOpen = false;
    this.selectedIncome = null;
  }

  confirmPayment(): void {
    if (!this.selectedIncome || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.financeService.confirmIncomePayment(this.selectedIncome.id).subscribe({
      next: () => {
        this.saving = false;
        this.closeConfirmPaymentModal();
        this.infoMessage = 'Pagamento da receita confirmado com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível confirmar o pagamento da receita.';
        this.saving = false;
      }
    });
  }

  openDeleteModal(income: FinanceIncomeItem): void {
    this.selectedIncome = income;
    this.errorMessage = null;
    this.infoMessage = null;
    this.confirmDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.confirmDeleteModalOpen = false;
    this.selectedIncome = null;
  }

  deleteIncome(): void {
    if (!this.selectedIncome || this.saving) {
      return;
    }

    this.errorMessage = null;
    this.infoMessage = null;
    this.saving = true;

    this.financeService.deleteIncome(this.selectedIncome.id).subscribe({
      next: () => {
        this.saving = false;
        this.closeDeleteModal();
        this.infoMessage = 'Receita removida com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível excluir a receita.';
        this.saving = false;
      }
    });
  }

  getPaymentStatusLabel(status: FinanceIncomePaymentStatus | null | undefined): string {
    const value = (status || '').trim().toUpperCase();
    if (value === 'PAGO') {
      return 'Pago';
    }
    return 'Aguardando pagamento';
  }

  getPaymentStatusClass(status: FinanceIncomePaymentStatus | null | undefined): string {
    const value = (status || '').trim().toUpperCase();
    return value === 'PAGO' ? 'status-paid' : 'status-pending';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  }

  private normalizePayload(form: FinanceIncomeRequest): FinanceIncomeRequest | null {
    const payload: FinanceIncomeRequest = {
      incomeTypeId: form.incomeTypeId,
      source: form.source || 'MANUAL',
      referenceId: form.referenceId || null,
      amount: Number(form.amount),
      description: (form.description || '').trim() || null,
      notes: (form.notes || '').trim() || null,
      occurredOn: form.occurredOn,
      paymentStatus: form.paymentStatus || 'PAGO'
    };

    if (!payload.incomeTypeId || !payload.occurredOn) {
      this.errorMessage = 'Preencha tipo e data da receita.';
      return null;
    }

    if (Number.isNaN(payload.amount) || payload.amount <= 0) {
      this.errorMessage = 'Informe um valor válido para a receita.';
      return null;
    }

    return payload;
  }

  private defaultForm(): FinanceIncomeRequest {
    return {
      incomeTypeId: '',
      source: 'MANUAL',
      referenceId: null,
      amount: 0,
      description: '',
      notes: '',
      occurredOn: this.today(),
      paymentStatus: 'PAGO'
    };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
