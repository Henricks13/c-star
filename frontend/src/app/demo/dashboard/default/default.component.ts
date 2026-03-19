// Angular Import
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

// project import
import { FinanceService } from 'src/app/core/finance/finance.service';
import { FinanceExpenseItem, FinanceIncomeItem } from 'src/app/core/finance/finance.types';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { BajajChartComponent } from 'src/app/theme/shared/components/apexchart/bajaj-chart/bajaj-chart.component';
import { BarChartComponent } from 'src/app/theme/shared/components/apexchart/bar-chart/bar-chart.component';
import { ChartDataMonthComponent } from 'src/app/theme/shared/components/apexchart/chart-data-month/chart-data-month.component';

type PeriodoGrafico = 'hoje' | 'mes' | 'ano';

interface SeriePeriodo {
  categories: string[];
  received: number[];
  receivable: number[];
  overdue: number[];
  total: number;
}

interface ContaDestaque {
  name: string;
  profit: string;
  invest: string;
  bgColor: string;
  icon: string;
  color: string;
  space?: string;
}

@Component({
  selector: 'app-default',
  imports: [BajajChartComponent, BarChartComponent, ChartDataMonthComponent, SharedModule],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;

  dashboardResumo = {
    saldoDisponivel: 0,
    totalReceberMes: 0,
    recebidoAno: 0,
    recebidoMes: 0
  };

  contasDestaque: ContaDestaque[] = [];
  aReceberSparkline: number[] = [0, 0, 0, 0, 0, 0, 0];

  recebidoComparativo = {
    monthAmount: 0,
    yearAmount: 0,
    monthSeries: [0, 0, 0, 0, 0, 0, 0, 0],
    yearSeries: [0, 0, 0, 0, 0, 0, 0, 0],
    monthReferenceLabel: 'Comparado ao mesmo mês do ano passado',
    yearReferenceLabel: 'Comparado ao acumulado do ano anterior'
  };

  barChartDataByPeriod: Record<PeriodoGrafico, SeriePeriodo> = {
    hoje: {
      categories: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'],
      received: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      receivable: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      overdue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      total: 0
    },
    mes: {
      categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      received: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      receivable: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      overdue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      total: 0
    },
    ano: {
      categories: ['-', '-', '-', '-', '-', '-'],
      received: [0, 0, 0, 0, 0, 0],
      receivable: [0, 0, 0, 0, 0, 0],
      overdue: [0, 0, 0, 0, 0, 0],
      total: 0
    }
  };

  constructor(private readonly financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  }

  private loadDashboard(): void {
    this.loading = true;
    this.errorMessage = null;

    forkJoin({
      incomes: this.financeService.listIncomes(),
      expenses: this.financeService.listExpenses()
    }).subscribe({
      next: ({ incomes, expenses }) => {
        this.applyResumo(incomes, expenses);
        this.applyGraficos(incomes);
        this.applyContasDestaque(incomes);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os dados financeiros do dashboard.';
        this.loading = false;
      }
    });
  }

  private applyResumo(incomes: FinanceIncomeItem[], expenses: FinanceExpenseItem[]): void {
    const today = this.startOfDay(new Date());
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const totalRecebido = incomes
      .filter((income) => this.isPaid(income))
      .reduce((sum, income) => sum + Number(income.amount || 0), 0);

    const totalDespesas = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const recebidoAno = incomes
      .filter((income) => {
        const date = this.toDate(income.occurredOn);
        return this.isPaid(income) && date.getFullYear() === currentYear;
      })
      .reduce((sum, income) => sum + Number(income.amount || 0), 0);

    const recebidoMes = incomes
      .filter((income) => {
        const date = this.toDate(income.occurredOn);
        return this.isPaid(income) && date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      })
      .reduce((sum, income) => sum + Number(income.amount || 0), 0);

    const aReceberMes = incomes
      .filter((income) => {
        const date = this.toDate(income.occurredOn);
        return !this.isPaid(income) && date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      })
      .reduce((sum, income) => sum + Number(income.amount || 0), 0);

    this.dashboardResumo = {
      saldoDisponivel: totalRecebido - totalDespesas,
      totalReceberMes: aReceberMes,
      recebidoAno,
      recebidoMes
    };

    this.recebidoComparativo.monthAmount = recebidoMes;
    this.recebidoComparativo.yearAmount = recebidoAno;
  }

  private applyGraficos(incomes: FinanceIncomeItem[]): void {
    const today = this.startOfDay(new Date());
    const currentYear = today.getFullYear();

    this.barChartDataByPeriod = {
      hoje: this.buildDailyPeriod(incomes, today),
      mes: this.buildMonthlyPeriod(incomes, currentYear, today),
      ano: this.buildYearlyPeriod(incomes, today)
    };

    this.aReceberSparkline = this.buildLastNDaysSeries(incomes, 7, (incomeDate, income) => {
      if (this.isPaid(income)) {
        return 0;
      }
      return this.toAmount(income);
    });

    this.recebidoComparativo.monthSeries = this.buildLastNDaysSeries(incomes, 8, (incomeDate, income) => {
      if (!this.isPaid(income)) {
        return 0;
      }
      return this.toAmount(income);
    });

    this.recebidoComparativo.yearSeries = this.buildLastNMonthsSeries(incomes, 8, (incomeDate, income) => {
      if (!this.isPaid(income)) {
        return 0;
      }
      return this.toAmount(income);
    });
  }

  private applyContasDestaque(incomes: FinanceIncomeItem[]): void {
    const today = this.startOfDay(new Date());
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const monthItems = incomes.filter((income) => {
      const date = this.toDate(income.occurredOn);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    const grouped = new Map<string, { total: number; pending: number; overdue: number }>();

    for (const income of monthItems) {
      const key = income.incomeTypeName || 'Sem categoria';
      const current = grouped.get(key) || { total: 0, pending: 0, overdue: 0 };
      const amount = this.toAmount(income);
      const incomeDate = this.toDate(income.occurredOn);

      current.total += amount;
      if (!this.isPaid(income)) {
        if (incomeDate < today) {
          current.overdue += amount;
        } else {
          current.pending += amount;
        }
      }

      grouped.set(key, current);
    }

    const items = Array.from(grouped.entries())
      .map(([name, totals]) => ({ name, ...totals }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((item, index, list): ContaDestaque => {
        if (item.overdue > 0) {
          return {
            name: item.name,
            profit: `${this.formatCurrency(item.overdue)} em atraso`,
            invest: this.formatCurrency(item.total),
            bgColor: 'bg-light-danger',
            icon: 'ti ti-chevron-down',
            color: 'text-danger',
            space: index === list.length - 1 ? 'pb-0' : undefined
          };
        }

        if (item.pending > 0) {
          return {
            name: item.name,
            profit: `${this.formatCurrency(item.pending)} a receber`,
            invest: this.formatCurrency(item.total),
            bgColor: 'bg-light-warning',
            icon: 'ti ti-clock-hour-4',
            color: 'text-warning',
            space: index === list.length - 1 ? 'pb-0' : undefined
          };
        }

        return {
          name: item.name,
          profit: 'Recebimento em dia',
          invest: this.formatCurrency(item.total),
          bgColor: 'bg-light-success',
          icon: 'ti ti-chevron-up',
          color: 'text-success',
          space: index === list.length - 1 ? 'pb-0' : undefined
        };
      });

    this.contasDestaque =
      items.length > 0
        ? items
        : [
            {
              name: 'Sem lançamentos no mês',
              profit: 'Cadastre receitas para visualizar destaques',
              invest: this.formatCurrency(0),
              bgColor: 'bg-light-secondary',
              icon: 'ti ti-minus',
              color: 'text-muted',
              space: 'pb-0'
            }
          ];
  }

  private buildDailyPeriod(incomes: FinanceIncomeItem[], today: Date): SeriePeriodo {
    const categories: string[] = [];
    const received: number[] = [];
    const receivable: number[] = [];
    const overdue: number[] = [];

    for (let offset = 11; offset >= 0; offset -= 1) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - offset);
      const dayLabel = `${String(targetDate.getDate()).padStart(2, '0')}/${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

      categories.push(dayLabel);
      const bucket = this.sumByDate(incomes, (incomeDate) => this.sameDay(incomeDate, targetDate), today);
      received.push(bucket.received);
      receivable.push(bucket.receivable);
      overdue.push(bucket.overdue);
    }

    return {
      categories,
      received,
      receivable,
      overdue,
      total: this.sumTotals(received, receivable, overdue)
    };
  }

  private buildMonthlyPeriod(incomes: FinanceIncomeItem[], year: number, today: Date): SeriePeriodo {
    const categories = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const received: number[] = [];
    const receivable: number[] = [];
    const overdue: number[] = [];

    for (let month = 0; month < 12; month += 1) {
      const bucket = this.sumByDate(
        incomes,
        (incomeDate) => incomeDate.getFullYear() === year && incomeDate.getMonth() === month,
        today
      );

      received.push(bucket.received);
      receivable.push(bucket.receivable);
      overdue.push(bucket.overdue);
    }

    return {
      categories,
      received,
      receivable,
      overdue,
      total: this.sumTotals(received, receivable, overdue)
    };
  }

  private buildYearlyPeriod(incomes: FinanceIncomeItem[], today: Date): SeriePeriodo {
    const currentYear = today.getFullYear();
    const baseYear = currentYear - 5;
    const categories: string[] = [];
    const received: number[] = [];
    const receivable: number[] = [];
    const overdue: number[] = [];

    for (let year = baseYear; year <= currentYear; year += 1) {
      categories.push(String(year));
      const bucket = this.sumByDate(incomes, (incomeDate) => incomeDate.getFullYear() === year, today);
      received.push(bucket.received);
      receivable.push(bucket.receivable);
      overdue.push(bucket.overdue);
    }

    return {
      categories,
      received,
      receivable,
      overdue,
      total: this.sumTotals(received, receivable, overdue)
    };
  }

  private buildLastNDaysSeries(
    incomes: FinanceIncomeItem[],
    days: number,
    selector: (incomeDate: Date, income: FinanceIncomeItem) => number
  ): number[] {
    const today = this.startOfDay(new Date());
    const output: number[] = [];

    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - offset);

      const value = incomes.reduce((sum, income) => {
        const incomeDate = this.toDate(income.occurredOn);
        if (!this.sameDay(incomeDate, targetDate)) {
          return sum;
        }
        return sum + selector(incomeDate, income);
      }, 0);

      output.push(Number(value.toFixed(2)));
    }

    return output;
  }

  private buildLastNMonthsSeries(
    incomes: FinanceIncomeItem[],
    months: number,
    selector: (incomeDate: Date, income: FinanceIncomeItem) => number
  ): number[] {
    const now = this.startOfDay(new Date());
    const output: number[] = [];

    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1);

      const value = incomes.reduce((sum, income) => {
        const incomeDate = this.toDate(income.occurredOn);
        const sameMonth = incomeDate.getFullYear() === ref.getFullYear() && incomeDate.getMonth() === ref.getMonth();
        if (!sameMonth) {
          return sum;
        }
        return sum + selector(incomeDate, income);
      }, 0);

      output.push(Number(value.toFixed(2)));
    }

    return output;
  }

  private sumByDate(
    incomes: FinanceIncomeItem[],
    matcher: (incomeDate: Date) => boolean,
    today: Date
  ): { received: number; receivable: number; overdue: number } {
    return incomes.reduce(
      (acc, income) => {
        const incomeDate = this.toDate(income.occurredOn);
        if (!matcher(incomeDate)) {
          return acc;
        }

        const amount = this.toAmount(income);
        if (this.isPaid(income)) {
          acc.received += amount;
        } else if (incomeDate < today) {
          acc.overdue += amount;
        } else {
          acc.receivable += amount;
        }

        return acc;
      },
      { received: 0, receivable: 0, overdue: 0 }
    );
  }

  private sumTotals(received: number[], receivable: number[], overdue: number[]): number {
    const sum = (values: number[]) => values.reduce((acc, value) => acc + Number(value || 0), 0);
    return sum(received) + sum(receivable) + sum(overdue);
  }

  private isPaid(income: FinanceIncomeItem): boolean {
    return (income.paymentStatus || '').trim().toUpperCase() === 'PAGO';
  }

  private toAmount(income: FinanceIncomeItem): number {
    return Number(income.amount || 0);
  }

  private toDate(value: string): Date {
    return this.startOfDay(new Date(`${value}T00:00:00`));
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
}
