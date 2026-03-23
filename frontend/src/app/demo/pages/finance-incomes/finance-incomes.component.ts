import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { FinanceService } from 'src/app/core/finance/finance.service';
import {
  FinanceIncomeItem,
  FinanceIncomePaymentStatus,
  FinanceIncomeRequest,
  FinanceTypeItem,
  IncomeSource
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
  filterSource: IncomeSource | null = null;
  filterReferenceId: string | null = null;
  selectedIncomeIds = new Set<string>();

  createModalOpen = false;
  editModalOpen = false;
  confirmPaymentModalOpen = false;
  confirmDeleteModalOpen = false;
  bulkConfirmPaymentModalOpen = false;
  bulkDeleteModalOpen = false;

  createForm: FinanceIncomeRequest = this.defaultForm();
  editForm: FinanceIncomeRequest = this.defaultForm();

  constructor(
    private readonly financeService: FinanceService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.readFilterFromRoute();
    this.loadAll();
  }

  get filteredIncomes(): FinanceIncomeItem[] {
    if (!this.filterSource || !this.filterReferenceId) {
      return this.incomes;
    }

    return this.incomes.filter((income) => income.source === this.filterSource && income.referenceId === this.filterReferenceId);
  }

  get selectedIncomes(): FinanceIncomeItem[] {
    return this.filteredIncomes.filter((income) => this.selectedIncomeIds.has(income.id));
  }

  get selectedCount(): number {
    return this.selectedIncomes.length;
  }

  get selectedPendingCount(): number {
    return this.selectedIncomes.filter((income) => income.paymentStatus === 'AGUARDANDO_PAGAMENTO').length;
  }

  get allFilteredSelected(): boolean {
    return this.filteredIncomes.length > 0 && this.filteredIncomes.every((income) => this.selectedIncomeIds.has(income.id));
  }

  get hasOrderFilter(): boolean {
    return !!(this.filterSource && this.filterReferenceId);
  }

  clearOrderFilter(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        source: null,
        referenceId: null
      },
      queryParamsHandling: 'merge'
    });

    this.filterSource = null;
    this.filterReferenceId = null;
    this.clearSelection();
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
            this.syncSelectionWithLoadedIncomes();
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

  openBulkConfirmPaymentModal(): void {
    if (this.selectedPendingCount === 0 || this.saving) {
      return;
    }
    this.errorMessage = null;
    this.infoMessage = null;
    this.bulkConfirmPaymentModalOpen = true;
  }

  closeBulkConfirmPaymentModal(): void {
    this.bulkConfirmPaymentModalOpen = false;
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

  openBulkDeleteModal(): void {
    if (this.selectedCount === 0 || this.saving) {
      return;
    }
    this.errorMessage = null;
    this.infoMessage = null;
    this.bulkDeleteModalOpen = true;
  }

  closeBulkDeleteModal(): void {
    this.bulkDeleteModalOpen = false;
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

  toggleSelectAllFiltered(checked: boolean): void {
    if (checked) {
      this.filteredIncomes.forEach((income) => this.selectedIncomeIds.add(income.id));
      return;
    }
    this.filteredIncomes.forEach((income) => this.selectedIncomeIds.delete(income.id));
  }

  toggleIncomeSelection(incomeId: string, checked: boolean): void {
    if (checked) {
      this.selectedIncomeIds.add(incomeId);
      return;
    }
    this.selectedIncomeIds.delete(incomeId);
  }

  isIncomeSelected(incomeId: string): boolean {
    return this.selectedIncomeIds.has(incomeId);
  }

  clearSelection(): void {
    this.selectedIncomeIds.clear();
  }

  confirmBulkPayment(): void {
    if (this.saving) {
      return;
    }

    const targetIds = this.selectedIncomes
      .filter((income) => income.paymentStatus === 'AGUARDANDO_PAGAMENTO')
      .map((income) => income.id);

    if (targetIds.length === 0) {
      this.errorMessage = 'Nenhuma receita pendente selecionada para dar baixa.';
      this.closeBulkConfirmPaymentModal();
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    const requests = targetIds.map((id) =>
      this.financeService.confirmIncomePayment(id).pipe(
        map(() => ({ success: true, message: '' })),
        catchError((error) => of({ success: false, message: this.extractApiErrorMessage(error) }))
      )
    );

    forkJoin(requests).subscribe((results) => {
      const successCount = results.filter((result) => result.success).length;
      const failed = results.filter((result) => !result.success);
      const failedCount = failed.length;

      this.saving = false;
      this.closeBulkConfirmPaymentModal();

      if (successCount > 0) {
        this.infoMessage = `Baixa em massa concluída para ${successCount} receita(s).`;
      }
      if (failedCount > 0) {
        const firstError = failed[0]?.message || 'Erro ao processar uma ou mais receitas.';
        this.errorMessage = `${failedCount} receita(s) não puderam ser baixadas. ${firstError}`;
      }

      this.clearSelection();
      this.loadAll();
    });
  }

  deleteIncomesBulk(): void {
    if (this.saving) {
      return;
    }

    const targetIds = this.selectedIncomes.map((income) => income.id);
    if (targetIds.length === 0) {
      this.errorMessage = 'Selecione ao menos uma receita para excluir.';
      this.closeBulkDeleteModal();
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    const requests = targetIds.map((id) =>
      this.financeService.deleteIncome(id).pipe(
        map(() => ({ success: true, message: '' })),
        catchError((error) => of({ success: false, message: this.extractApiErrorMessage(error) }))
      )
    );

    forkJoin(requests).subscribe((results) => {
      const successCount = results.filter((result) => result.success).length;
      const failed = results.filter((result) => !result.success);
      const failedCount = failed.length;

      this.saving = false;
      this.closeBulkDeleteModal();

      if (successCount > 0) {
        this.infoMessage = `Exclusão em massa concluída para ${successCount} receita(s).`;
      }
      if (failedCount > 0) {
        const firstError = failed[0]?.message || 'Erro ao processar uma ou mais receitas.';
        this.errorMessage = `${failedCount} receita(s) não puderam ser excluídas. ${firstError}`;
      }

      this.clearSelection();
      this.loadAll();
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

  private readFilterFromRoute(): void {
    const source = (this.route.snapshot.queryParamMap.get('source') || '').trim().toUpperCase();
    const referenceId = (this.route.snapshot.queryParamMap.get('referenceId') || '').trim();

    if (source === 'SERVICE_ORDER' && referenceId) {
      this.filterSource = 'SERVICE_ORDER';
      this.filterReferenceId = referenceId;
      return;
    }

    this.filterSource = null;
    this.filterReferenceId = null;
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

  private syncSelectionWithLoadedIncomes(): void {
    const loadedIds = new Set(this.incomes.map((income) => income.id));
    this.selectedIncomeIds.forEach((id) => {
      if (!loadedIds.has(id)) {
        this.selectedIncomeIds.delete(id);
      }
    });
  }

  private extractApiErrorMessage(error: any): string {
    const message = error?.error?.message || error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    return 'Erro inesperado.';
  }
}
