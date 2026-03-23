import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinanceService } from 'src/app/core/finance/finance.service';
import { FinanceTypeItem, FinanceTypeRequest } from 'src/app/core/finance/finance.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-finance-expense-types',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './finance-expense-types.component.html',
  styleUrls: ['./finance-expense-types.component.scss']
})
export class FinanceExpenseTypesComponent implements OnInit {
  loading = false;
  saving = false;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  types: FinanceTypeItem[] = [];
  selectedType: FinanceTypeItem | null = null;
  selectedTypeForDeletion: FinanceTypeItem | null = null;

  createModalOpen = false;
  editModalOpen = false;
  deleteModalOpen = false;

  createForm: FinanceTypeRequest = this.defaultForm();
  editForm: FinanceTypeRequest = this.defaultForm();

  constructor(private readonly financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadTypes();
  }

  loadTypes(): void {
    this.loading = true;
    this.errorMessage = null;

    this.financeService.listExpenseTypes().subscribe({
      next: (response) => {
        this.types = response;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os tipos de despesa.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.createForm = this.defaultForm();
    this.errorMessage = null;
    this.infoMessage = null;
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  createType(): void {
    if (this.saving) {
      return;
    }

    const payload: FinanceTypeRequest = {
      name: (this.createForm.name || '').trim(),
      description: (this.createForm.description || '').trim() || null
    };

    if (!payload.name) {
      this.errorMessage = 'Informe o nome do tipo de despesa.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.financeService.createExpenseType(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeCreateModal();
        this.infoMessage = 'Tipo de despesa cadastrado com sucesso.';
        this.loadTypes();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível cadastrar o tipo de despesa.';
        this.saving = false;
      }
    });
  }

  openEditModal(type: FinanceTypeItem): void {
    this.selectedType = type;
    this.editForm = {
      name: type.name,
      description: type.description || ''
    };
    this.errorMessage = null;
    this.infoMessage = null;
    this.editModalOpen = true;
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.selectedType = null;
  }

  updateType(): void {
    if (!this.selectedType || this.saving) {
      return;
    }

    const payload: FinanceTypeRequest = {
      name: (this.editForm.name || '').trim(),
      description: (this.editForm.description || '').trim() || null
    };

    if (!payload.name) {
      this.errorMessage = 'Informe o nome do tipo de despesa.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.financeService.updateExpenseType(this.selectedType.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.infoMessage = 'Tipo de despesa atualizado com sucesso.';
        this.loadTypes();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível atualizar o tipo de despesa.';
        this.saving = false;
      }
    });
  }

  deleteType(type: FinanceTypeItem): void {
    if (this.saving) {
      return;
    }

    this.selectedTypeForDeletion = type;
    this.deleteModalOpen = true;
    this.errorMessage = null;
    this.infoMessage = null;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.selectedTypeForDeletion = null;
  }

  confirmDeleteType(): void {
    if (!this.selectedTypeForDeletion || this.saving) {
      return;
    }

    this.saving = true;

    this.errorMessage = null;
    this.infoMessage = null;

    this.financeService.deleteExpenseType(this.selectedTypeForDeletion.id).subscribe({
      next: () => {
        this.saving = false;
        this.closeDeleteModal();
        this.infoMessage = 'Tipo de despesa removido com sucesso.';
        this.loadTypes();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Não foi possível excluir o tipo de despesa.';
      }
    });
  }

  private defaultForm(): FinanceTypeRequest {
    return {
      name: '',
      description: ''
    };
  }
}
