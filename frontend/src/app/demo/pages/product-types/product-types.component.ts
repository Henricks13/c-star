import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ProductTypesService } from 'src/app/core/products/product-types.service';
import { CreateProductTypeRequest, ProductTypeItem, UpdateProductTypeRequest } from 'src/app/core/products/product-types.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-product-types',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './product-types.component.html',
  styleUrls: ['./product-types.component.scss']
})
export class ProductTypesComponent implements OnInit {
  loading = false;
  saving = false;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  types: ProductTypeItem[] = [];
  selectedType: ProductTypeItem | null = null;

  createModalOpen = false;
  editModalOpen = false;

  createForm: CreateProductTypeRequest = this.defaultCreateForm();
  editForm: UpdateProductTypeRequest = this.defaultEditForm();

  constructor(private readonly productTypesService: ProductTypesService) {}

  ngOnInit(): void {
    this.loadTypes();
  }

  loadTypes(): void {
    this.loading = true;
    this.errorMessage = null;

    this.productTypesService.list().subscribe({
      next: (response) => {
        this.types = response;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os tipos de produto.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.createForm = this.defaultCreateForm();
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

    const payload: CreateProductTypeRequest = {
      name: (this.createForm.name || '').trim(),
      description: (this.createForm.description || '').trim() || null,
      active: this.createForm.active !== false
    };

    if (!payload.name) {
      this.errorMessage = 'Informe o nome do tipo de produto.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.productTypesService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeCreateModal();
        this.infoMessage = 'Tipo de produto cadastrado com sucesso.';
        this.loadTypes();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível cadastrar o tipo de produto.';
        this.saving = false;
      }
    });
  }

  openEditModal(type: ProductTypeItem): void {
    this.selectedType = type;
    this.editForm = {
      name: type.name,
      description: type.description || '',
      active: type.active
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

    const payload: UpdateProductTypeRequest = {
      name: (this.editForm.name || '').trim(),
      description: (this.editForm.description || '').trim() || null,
      active: this.editForm.active !== false
    };

    if (!payload.name) {
      this.errorMessage = 'Informe o nome do tipo de produto.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.productTypesService.update(this.selectedType.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.infoMessage = 'Tipo de produto atualizado com sucesso.';
        this.loadTypes();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível atualizar o tipo de produto.';
        this.saving = false;
      }
    });
  }

  deleteType(type: ProductTypeItem): void {
    if (!confirm(`Deseja excluir o tipo "${type.name}"?`)) {
      return;
    }

    this.errorMessage = null;
    this.infoMessage = null;

    this.productTypesService.delete(type.id).subscribe({
      next: () => {
        this.infoMessage = 'Tipo de produto removido com sucesso.';
        this.loadTypes();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível excluir o tipo de produto.';
      }
    });
  }

  private defaultCreateForm(): CreateProductTypeRequest {
    return {
      name: '',
      description: '',
      active: true
    };
  }

  private defaultEditForm(): UpdateProductTypeRequest {
    return {
      name: '',
      description: '',
      active: true
    };
  }
}
