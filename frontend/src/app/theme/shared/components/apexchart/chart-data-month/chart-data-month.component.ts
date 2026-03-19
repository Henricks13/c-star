// angular import
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

// third party
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-chart-data-month',
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './chart-data-month.component.html',
  styleUrl: './chart-data-month.component.scss'
})
export class ChartDataMonthComponent implements OnInit, OnChanges {
  // public props
  @ViewChild('chart') chart!: ChartComponent;
  @Input() monthAmount = 0;
  @Input() yearAmount = 0;
  @Input() monthSeries: number[] = [12, 18, 14, 22, 20, 26, 21, 24];
  @Input() yearSeries: number[] = [132, 146, 158, 149, 171, 182, 175, 189];
  @Input() monthReferenceLabel = 'Comparado ao mesmo mês do ano passado';
  @Input() yearReferenceLabel = 'Comparado ao acumulado do ano anterior';

  chartOptions!: Partial<ApexOptions>;
  amount = 0;
  referenceLabel = '';
  btnActive!: string;

  // life cycle event
  ngOnInit() {
    this.btnActive = 'month';
    this.chartOptions = {
      chart: {
        type: 'line',
        height: 90,
        sparkline: {
          enabled: true
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#FFF'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      series: [
        {
          name: 'Recebido',
          data: this.monthSeries
        }
      ],
      yaxis: {
        min: 0,
        max: this.calculateMax(this.monthSeries)
      },
      tooltip: {
        theme: 'dark',
        fixed: {
          enabled: false
        },
        x: {
          show: false
        },
        marker: {
          show: false
        }
      }
    };

    this.applyCurrentState();
  }

  ngOnChanges(_: SimpleChanges): void {
    if (!this.chartOptions) {
      return;
    }

    this.applyCurrentState();
  }

  handleKeyDown(event: KeyboardEvent, value: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.toggleActive(value);
      event.preventDefault(); // Prevent default scrolling for the spacebar key
    }
  }

  // public method
  toggleActive(value: string) {
    this.btnActive = value;
    this.applyCurrentState();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private applyCurrentState(): void {
    const activeSeries = this.btnActive === 'year' ? this.yearSeries : this.monthSeries;

    this.chartOptions.series = [
      {
        name: 'Recebido',
        data: activeSeries
      }
    ];

    this.chartOptions.yaxis = {
      min: 0,
      max: this.calculateMax(activeSeries)
    };

    this.amount = this.btnActive === 'year' ? this.yearAmount : this.monthAmount;
    this.referenceLabel = this.btnActive === 'year' ? this.yearReferenceLabel : this.monthReferenceLabel;
  }

  private calculateMax(series: number[]): number {
    const maxValue = Math.max(...series, 1);
    return Number((maxValue * 1.2).toFixed(2));
  }
}
