import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ProductTypesService } from 'src/app/core/products/product-types.service';
import { CreateProductTypeRequest, ProductTypeItem, UpdateProductTypeRequest } from 'src/app/core/products/product-types.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-product-categories',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './product-categories.component.html',
  styleUrls: ['./product-categories.component.scss']
})
export class ProductCategoriesComponent implements OnInit {
  loading = false;
  saving = false;
  togglingCategoryId: string | null = null;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  categories: ProductTypeItem[] = [];
  selectedCategory: ProductTypeItem | null = null;
  selectedCategoryForDeletion: ProductTypeItem | null = null;

  createModalOpen = false;
  editModalOpen = false;
  deleteModalOpen = false;

  createForm: CreateProductTypeRequest = this.defaultCreateForm();
  editForm: UpdateProductTypeRequest = this.defaultEditForm();

  constructor(private readonly productTypesService: ProductTypesService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.errorMessage = null;

    this.productTypesService.list().subscribe({
      next: (response) => {
        this.categories = response;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar as categorias de produto.';
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

  createCategory(): void {
    if (this.saving) {
      return;
    }

    const payload: CreateProductTypeRequest = {
      name: (this.createForm.name || '').trim(),
      description: (this.createForm.description || '').trim() || null,
      active: this.createForm.active !== false
    };

    if (!payload.name) {
      this.errorMessage = 'Informe o nome da categoria.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.productTypesService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeCreateModal();
        this.infoMessage = 'Categoria cadastrada com sucesso.';
        this.loadCategories();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Nao foi possivel cadastrar a categoria.';
        this.saving = false;
      }
    });
  }

  openEditModal(category: ProductTypeItem): void {
    this.selectedCategory = category;
    this.editForm = {
      name: category.name,
      description: category.description || '',
      active: category.active
    };
    this.errorMessage = null;
    this.infoMessage = null;
    this.editModalOpen = true;
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.selectedCategory = null;
  }

  updateCategory(): void {
    if (!this.selectedCategory || this.saving) {
      return;
    }

    const payload: UpdateProductTypeRequest = {
      name: (this.editForm.name || '').trim(),
      description: (this.editForm.description || '').trim() || null,
      active: this.editForm.active !== false
    };

    if (!payload.name) {
      this.errorMessage = 'Informe o nome da categoria.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.productTypesService.update(this.selectedCategory.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.infoMessage = 'Categoria atualizada com sucesso.';
        this.loadCategories();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Nao foi possivel atualizar a categoria.';
        this.saving = false;
      }
    });
  }

  deleteCategory(category: ProductTypeItem): void {
    if (this.saving) {
      return;
    }

    this.selectedCategoryForDeletion = category;
    this.deleteModalOpen = true;
    this.errorMessage = null;
    this.infoMessage = null;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.selectedCategoryForDeletion = null;
  }

  confirmDeleteCategory(): void {
    if (!this.selectedCategoryForDeletion || this.saving) {
      return;
    }

    this.saving = true;

    this.errorMessage = null;
    this.infoMessage = null;

    this.productTypesService.delete(this.selectedCategoryForDeletion.id).subscribe({
      next: () => {
        this.saving = false;
        this.closeDeleteModal();
        this.infoMessage = 'Categoria removida com sucesso.';
        this.loadCategories();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Nao foi possivel excluir a categoria.';
      }
    });
  }

  toggleCategoryActive(category: ProductTypeItem, nextActive: boolean): void {
    if (this.togglingCategoryId) {
      return;
    }

    const payload: UpdateProductTypeRequest = {
      name: category.name,
      description: category.description,
      active: nextActive
    };

    this.togglingCategoryId = category.id;
    this.errorMessage = null;
    this.infoMessage = null;

    this.productTypesService.update(category.id, payload).subscribe({
      next: (updated) => {
        category.active = updated.active;
        this.infoMessage = updated.active ? 'Categoria ativada com sucesso.' : 'Categoria desativada com sucesso.';
        this.togglingCategoryId = null;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Nao foi possivel alterar o status da categoria.';
        this.togglingCategoryId = null;
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
