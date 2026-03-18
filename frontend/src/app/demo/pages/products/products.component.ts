import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ProductTypesService } from 'src/app/core/products/product-types.service';
import { ProductTypeItem } from 'src/app/core/products/product-types.types';
import { ProductsService } from 'src/app/core/products/products.service';
import {
  CreateProductRequest,
  ProductItem,
  StockAdjustmentOperation,
  StockAdjustmentRequest,
  UpdateProductRequest
} from 'src/app/core/products/products.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

interface StockAdjustmentFormModel {
  operation: StockAdjustmentOperation;
  quantity: number;
  customPriceEnabled: boolean;
  customUnitPrice: number | null;
  notes: string;
}

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  loading = false;
  saving = false;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  products: ProductItem[] = [];
  productTypes: ProductTypeItem[] = [];
  selectedProduct: ProductItem | null = null;
  selectedProductForStock: ProductItem | null = null;
  productPendingDelete: ProductItem | null = null;

  createModalOpen = false;
  editModalOpen = false;
  stockModalOpen = false;
  deleteModalOpen = false;

  createForm: CreateProductRequest = this.defaultCreateForm();
  editForm: UpdateProductRequest = this.defaultEditForm();
  stockForm: StockAdjustmentFormModel = this.defaultStockForm();

  constructor(
    private readonly productsService: ProductsService,
    private readonly productTypesService: ProductTypesService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = null;

    this.productTypesService.list().subscribe({
      next: (types) => {
        this.productTypes = types.filter((type) => type.active);
        this.productsService.list().subscribe({
          next: (products) => {
            this.products = products;
            this.loading = false;
          },
          error: () => {
            this.errorMessage = 'Não foi possível carregar os produtos.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os tipos de produto.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    if (this.productTypes.length === 0) {
      this.errorMessage = 'Cadastre ao menos um tipo de produto ativo antes de criar produtos.';
      return;
    }

    this.createForm = this.defaultCreateForm();
    this.createForm.productTypeId = this.productTypes[0]?.id || '';
    this.errorMessage = null;
    this.infoMessage = null;
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  createProduct(): void {
    if (this.saving) {
      return;
    }

    const payload = this.normalizeCreatePayload();
    if (!payload) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.productsService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeCreateModal();
        this.infoMessage = 'Produto cadastrado com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível cadastrar o produto.';
        this.saving = false;
      }
    });
  }

  openEditModal(product: ProductItem): void {
    this.selectedProduct = product;
    this.editForm = {
      name: product.name,
      sku: product.sku || '',
      productTypeId: product.productTypeId,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      stockQuantity: product.stockQuantity,
      minimumStock: product.minimumStock,
      perishable: product.perishable,
      expirationDate: product.expirationDate,
      active: product.active,
      notes: product.notes || ''
    };

    this.errorMessage = null;
    this.infoMessage = null;
    this.editModalOpen = true;
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.selectedProduct = null;
  }

  updateProduct(): void {
    if (!this.selectedProduct || this.saving) {
      return;
    }

    const payload = this.normalizeUpdatePayload();
    if (!payload) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.productsService.update(this.selectedProduct.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.infoMessage = 'Produto atualizado com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível atualizar o produto.';
        this.saving = false;
      }
    });
  }

  openStockModal(product: ProductItem): void {
    this.selectedProductForStock = product;
    this.stockForm = this.defaultStockForm();
    this.errorMessage = null;
    this.infoMessage = null;
    this.stockModalOpen = true;
  }

  closeStockModal(): void {
    this.stockModalOpen = false;
    this.selectedProductForStock = null;
  }

  onStockOperationChange(): void {
    this.stockForm.customPriceEnabled = false;
    this.stockForm.customUnitPrice = null;
  }

  applyStockAdjustment(): void {
    if (!this.selectedProductForStock || this.saving) {
      return;
    }

    const payload = this.normalizeStockPayload();
    if (!payload) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.productsService.adjustStock(this.selectedProductForStock.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeStockModal();
        this.infoMessage = 'Estoque ajustado e financeiro atualizado com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível ajustar o estoque.';
        this.saving = false;
      }
    });
  }

  openDeleteModal(product: ProductItem): void {
    this.productPendingDelete = product;
    this.errorMessage = null;
    this.infoMessage = null;
    this.deleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.productPendingDelete = null;
  }

  confirmDeleteProduct(): void {
    if (!this.productPendingDelete || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.productsService.delete(this.productPendingDelete.id).subscribe({
      next: () => {
        this.saving = false;
        this.closeDeleteModal();
        this.infoMessage = 'Produto removido com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível excluir o produto.';
        this.saving = false;
      }
    });
  }

  isLowStock(product: ProductItem): boolean {
    return Number(product.stockQuantity) <= Number(product.minimumStock);
  }

  adjustmentOperationLabel(operation: StockAdjustmentOperation | null): string {
    if (operation === 'ADD') {
      return 'Adição';
    }

    if (operation === 'REMOVE') {
      return 'Retirada';
    }

    return 'Sem ajuste';
  }

  private normalizeCreatePayload(): CreateProductRequest | null {
    const payload: CreateProductRequest = {
      name: (this.createForm.name || '').trim(),
      sku: (this.createForm.sku || '').trim() || null,
      productTypeId: this.createForm.productTypeId,
      purchasePrice: Number(this.createForm.purchasePrice),
      salePrice: Number(this.createForm.salePrice),
      stockQuantity: Number(this.createForm.stockQuantity),
      minimumStock: Number(this.createForm.minimumStock),
      perishable: !!this.createForm.perishable,
      expirationDate: this.createForm.perishable ? this.createForm.expirationDate || null : null,
      active: this.createForm.active !== false,
      notes: (this.createForm.notes || '').trim() || null
    };

    return this.validatePayload(payload);
  }

  private normalizeUpdatePayload(): UpdateProductRequest | null {
    const payload: UpdateProductRequest = {
      name: (this.editForm.name || '').trim(),
      sku: (this.editForm.sku || '').trim() || null,
      productTypeId: this.editForm.productTypeId,
      purchasePrice: Number(this.editForm.purchasePrice),
      salePrice: Number(this.editForm.salePrice),
      stockQuantity: Number(this.editForm.stockQuantity),
      minimumStock: Number(this.editForm.minimumStock),
      perishable: !!this.editForm.perishable,
      expirationDate: this.editForm.perishable ? this.editForm.expirationDate || null : null,
      active: this.editForm.active !== false,
      notes: (this.editForm.notes || '').trim() || null
    };

    return this.validatePayload(payload);
  }

  private validatePayload<T extends CreateProductRequest | UpdateProductRequest>(payload: T): T | null {
    if (!payload.name || !payload.productTypeId) {
      this.errorMessage = 'Preencha nome e tipo do produto.';
      return null;
    }

    if ([payload.purchasePrice, payload.salePrice, payload.stockQuantity, payload.minimumStock].some((value) => Number.isNaN(value) || value < 0)) {
      this.errorMessage = 'Preços e estoque não podem ser negativos.';
      return null;
    }

    if (payload.perishable && !payload.expirationDate) {
      this.errorMessage = 'Informe a validade para produto perecível.';
      return null;
    }

    return payload;
  }

  private defaultCreateForm(): CreateProductRequest {
    return {
      name: '',
      sku: '',
      productTypeId: '',
      purchasePrice: 0,
      salePrice: 0,
      stockQuantity: 0,
      minimumStock: 0,
      perishable: false,
      expirationDate: null,
      active: true,
      notes: ''
    };
  }

  private defaultEditForm(): UpdateProductRequest {
    return {
      name: '',
      sku: '',
      productTypeId: '',
      purchasePrice: 0,
      salePrice: 0,
      stockQuantity: 0,
      minimumStock: 0,
      perishable: false,
      expirationDate: null,
      active: true,
      notes: ''
    };
  }

  private normalizeStockPayload(): StockAdjustmentRequest | null {
    const payload: StockAdjustmentRequest = {
      operation: this.stockForm.operation,
      quantity: Number(this.stockForm.quantity),
      customUnitPrice: this.stockForm.customPriceEnabled ? Number(this.stockForm.customUnitPrice) : null,
      notes: (this.stockForm.notes || '').trim() || null
    };

    if (Number.isNaN(payload.quantity) || payload.quantity <= 0) {
      this.errorMessage = 'Informe uma quantidade válida para o ajuste.';
      return null;
    }

    if (this.stockForm.customPriceEnabled) {
      const customPrice = Number(payload.customUnitPrice);
      if (Number.isNaN(customPrice) || customPrice < 0) {
        this.errorMessage = 'Informe um preço personalizado válido.';
        return null;
      }
      payload.customUnitPrice = customPrice;
    }

    return payload;
  }

  private defaultStockForm(): StockAdjustmentFormModel {
    return {
      operation: 'ADD',
      quantity: 1,
      customPriceEnabled: false,
      customUnitPrice: null,
      notes: ''
    };
  }
}
