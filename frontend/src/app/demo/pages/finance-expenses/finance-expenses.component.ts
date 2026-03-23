import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { FinanceService } from 'src/app/core/finance/finance.service';
import { FinanceExpenseItem, FinanceExpenseRequest, FinanceTypeItem } from 'src/app/core/finance/finance.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-finance-expenses',
  imports: [CommonModule, FormsModule, NgSelectModule, CardComponent],
  templateUrl: './finance-expenses.component.html',
  styleUrls: ['./finance-expenses.component.scss']
})
export class FinanceExpensesComponent implements OnInit {
  loading = false;
  saving = false;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  expenses: FinanceExpenseItem[] = [];
  expenseTypes: FinanceTypeItem[] = [];
  selectedExpense: FinanceExpenseItem | null = null;
  selectedExpenseForDeletion: FinanceExpenseItem | null = null;

  createModalOpen = false;
  editModalOpen = false;
  deleteModalOpen = false;

  createForm: FinanceExpenseRequest = this.defaultForm();
  editForm: FinanceExpenseRequest = this.defaultForm();

  constructor(private readonly financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = null;

    this.financeService.listExpenseTypes().subscribe({
      next: (types) => {
        this.expenseTypes = types;
        this.financeService.listExpenses().subscribe({
          next: (items) => {
            this.expenses = items;
            this.loading = false;
          },
          error: () => {
            this.errorMessage = 'Não foi possível carregar as despesas.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os tipos de despesa.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    if (this.expenseTypes.length === 0) {
      this.errorMessage = 'Cadastre ao menos um tipo de despesa antes de lançar despesas.';
      return;
    }

    this.createForm = this.defaultForm();
    this.createForm.expenseTypeId = this.expenseTypes[0]?.id || '';
    this.errorMessage = null;
    this.infoMessage = null;
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  createExpense(): void {
    if (this.saving) {
      return;
    }

    const payload = this.normalizePayload(this.createForm);
    if (!payload) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.financeService.createExpense(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeCreateModal();
        this.infoMessage = 'Despesa lançada com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível lançar a despesa.';
        this.saving = false;
      }
    });
  }

  openEditModal(expense: FinanceExpenseItem): void {
    this.selectedExpense = expense;
    this.editForm = {
      expenseTypeId: expense.expenseTypeId,
      amount: expense.amount,
      description: expense.description || '',
      notes: expense.notes || '',
      occurredOn: expense.occurredOn
    };
    this.errorMessage = null;
    this.infoMessage = null;
    this.editModalOpen = true;
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.selectedExpense = null;
  }

  updateExpense(): void {
    if (!this.selectedExpense || this.saving) {
      return;
    }

    const payload = this.normalizePayload(this.editForm);
    if (!payload) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.financeService.updateExpense(this.selectedExpense.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.infoMessage = 'Despesa atualizada com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível atualizar a despesa.';
        this.saving = false;
      }
    });
  }

  deleteExpense(expense: FinanceExpenseItem): void {
    if (this.saving) {
      return;
    }

    this.selectedExpenseForDeletion = expense;
    this.deleteModalOpen = true;
    this.errorMessage = null;
    this.infoMessage = null;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.selectedExpenseForDeletion = null;
  }

  confirmDeleteExpense(): void {
    if (!this.selectedExpenseForDeletion || this.saving) {
      return;
    }

    this.saving = true;

    this.errorMessage = null;
    this.infoMessage = null;

    this.financeService.deleteExpense(this.selectedExpenseForDeletion.id).subscribe({
      next: () => {
        this.saving = false;
        this.closeDeleteModal();
        this.infoMessage = 'Despesa removida com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Não foi possível excluir a despesa.';
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  }

  private normalizePayload(form: FinanceExpenseRequest): FinanceExpenseRequest | null {
    const payload: FinanceExpenseRequest = {
      expenseTypeId: form.expenseTypeId,
      amount: Number(form.amount),
      description: (form.description || '').trim() || null,
      notes: (form.notes || '').trim() || null,
      occurredOn: form.occurredOn
    };

    if (!payload.expenseTypeId || !payload.occurredOn) {
      this.errorMessage = 'Preencha tipo e data da despesa.';
      return null;
    }

    if (Number.isNaN(payload.amount) || payload.amount <= 0) {
      this.errorMessage = 'Informe um valor válido para a despesa.';
      return null;
    }

    return payload;
  }

  private defaultForm(): FinanceExpenseRequest {
    return {
      expenseTypeId: '',
      amount: 0,
      description: '',
      notes: '',
      occurredOn: this.today()
    };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
