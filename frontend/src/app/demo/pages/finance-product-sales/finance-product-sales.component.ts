import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinanceService } from 'src/app/core/finance/finance.service';
import { ProductSale, ProductSaleRequest } from 'src/app/core/finance/finance.types';
import { ProductsService } from 'src/app/core/products/products.service';
import { ProductItem } from 'src/app/core/products/products.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

interface ProductSaleLineForm {
  productId: string;
  quantity: number;
}

@Component({
  selector: 'app-finance-product-sales',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './finance-product-sales.component.html',
  styleUrls: ['./finance-product-sales.component.scss']
})
export class FinanceProductSalesComponent implements OnInit {
  loading = false;
  saving = false;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  products: ProductItem[] = [];
  sales: ProductSale[] = [];

  createModalOpen = false;

  createForm: ProductSaleRequest = this.defaultForm();
  lineItems: ProductSaleLineForm[] = [this.defaultLine()];

  constructor(
    private readonly financeService: FinanceService,
    private readonly productsService: ProductsService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = null;

    this.productsService.list().subscribe({
      next: (products) => {
        this.products = products.filter((product) => product.active);
        this.financeService.listProductSales().subscribe({
          next: (sales) => {
            this.sales = sales;
            this.loading = false;
          },
          error: () => {
            this.errorMessage = 'Não foi possível carregar as vendas avulsas.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os produtos.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    if (this.products.length === 0) {
      this.errorMessage = 'Cadastre produtos ativos para lançar vendas avulsas.';
      return;
    }

    this.createForm = this.defaultForm();
    this.lineItems = [
      {
        productId: this.products[0]?.id || '',
        quantity: 1
      }
    ];
    this.errorMessage = null;
    this.infoMessage = null;
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  addLine(): void {
    this.lineItems.push({
      productId: this.products[0]?.id || '',
      quantity: 1
    });
  }

  removeLine(index: number): void {
    if (this.lineItems.length === 1) {
      return;
    }

    this.lineItems.splice(index, 1);
  }

  createSale(): void {
    if (this.saving) {
      return;
    }

    const payload = this.normalizePayload();
    if (!payload) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.financeService.createProductSale(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeCreateModal();
        this.infoMessage = 'Venda avulsa registrada com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível registrar a venda avulsa.';
        this.saving = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  }

  private normalizePayload(): ProductSaleRequest | null {
    const items = this.lineItems.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity)
    }));

    if (!this.createForm.occurredOn) {
      this.errorMessage = 'Informe a data da venda avulsa.';
      return null;
    }

    if (items.length === 0 || items.some((item) => !item.productId || Number.isNaN(item.quantity) || item.quantity <= 0)) {
      this.errorMessage = 'Informe produtos e quantidades válidas para a venda avulsa.';
      return null;
    }

    return {
      customerName: (this.createForm.customerName || '').trim() || null,
      notes: (this.createForm.notes || '').trim() || null,
      occurredOn: this.createForm.occurredOn,
      items
    };
  }

  private defaultForm(): ProductSaleRequest {
    return {
      customerName: '',
      notes: '',
      occurredOn: this.today(),
      items: []
    };
  }

  private defaultLine(): ProductSaleLineForm {
    return {
      productId: '',
      quantity: 1
    };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
