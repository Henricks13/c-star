import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinanceService } from 'src/app/core/finance/finance.service';
import { FinanceReport, FinanceReportItem } from 'src/app/core/finance/finance.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-finance-report',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './finance-report.component.html',
  styleUrls: ['./finance-report.component.scss']
})
export class FinanceReportComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;

  filters = {
    startDate: '',
    endDate: ''
  };

  report: FinanceReport | null = null;

  constructor(private readonly financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    this.errorMessage = null;

    this.financeService.getReport(this.filters.startDate || null, this.filters.endDate || null).subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar o relatório financeiro.';
        this.loading = false;
      }
    });
  }

  clearFilters(): void {
    this.filters = { startDate: '', endDate: '' };
    this.loadReport();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  }

  formatKind(kind: string): string {
    return kind === 'ENTRADA' ? 'Entrada' : 'Saída';
  }

  formatSource(source: string | null | undefined): string {
    const normalized = (source || '').trim().toUpperCase();

    if (normalized === 'SERVICE_ORDER') {
      return 'Ordem de serviço';
    }

    if (normalized === 'PRODUCT_SALE') {
      return 'Venda de produto';
    }

    if (normalized === 'MANUAL') {
      return 'Manual';
    }

    return source || '—';
  }

  trackByItemId(_: number, item: FinanceReportItem): string {
    return item.id;
  }
}
