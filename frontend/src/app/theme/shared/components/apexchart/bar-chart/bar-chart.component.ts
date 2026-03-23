// angular import
import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

// third party
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';

type BarChartPeriodKey = 'hoje' | 'mes' | 'ano';

interface BarChartPeriodData {
  categories: string[];
  received: number[];
  receivable: number[];
  overdue: number[];
  total: number;
}

@Component({
  selector: 'app-bar-chart',
  imports: [NgApexchartsModule, FormsModule, NgSelectModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss'
})
export class BarChartComponent implements OnChanges {
  // public props
  @ViewChild('chart') chart!: ChartComponent;
  @Input() chartDataByPeriod?: Record<BarChartPeriodKey, BarChartPeriodData>;

  chartOptions!: Partial<ApexOptions>;
  periodo: BarChartPeriodKey = 'mes';
  totalPeriodo = 0;

  private readonly dadosPadraoPorPeriodo: Record<BarChartPeriodKey, BarChartPeriodData> = {
    hoje: {
      categories: ['01/01', '02/01', '03/01', '04/01', '05/01', '06/01', '07/01', '08/01', '09/01', '10/01', '11/01', '12/01'],
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
      categories: ['2021', '2022', '2023', '2024', '2025', '2026'],
      received: [0, 0, 0, 0, 0, 0],
      receivable: [0, 0, 0, 0, 0, 0],
      overdue: [0, 0, 0, 0, 0, 0],
      total: 0
    }
  };

  // Constructor
  constructor() {
    const dadosMes = this.resolveDadosPorPeriodo()['mes'];

    this.chartOptions = {
      series: [
        {
          name: 'Recebido',
          data: dadosMes.received
        },
        {
          name: 'A receber',
          data: dadosMes.receivable
        },
        {
          name: 'Inadimplência',
          data: dadosMes.overdue
        }
      ],
      dataLabels: {
        enabled: false
      },
      chart: {
        type: 'bar',
        height: 480,
        stacked: true,
        toolbar: {
          show: true
        },
        background: 'transparent'
      },
      colors: ['#cfd9e3', '#d4af37', '#b68d6a'],
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: 'bottom',
              offsetX: -10,
              offsetY: 0
            }
          }
        }
      ],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%'
        }
      },
      xaxis: {
        type: 'category',
        categories: dadosMes.categories
      },
      tooltip: {
        theme: 'light'
      }
    };

    this.totalPeriodo = dadosMes.total;
  }

  ngOnChanges(_: SimpleChanges): void {
    this.alterarPeriodo(this.periodo);
  }

  alterarPeriodo(periodo: BarChartPeriodKey): void {
    this.periodo = periodo;
    const dadosPorPeriodo = this.resolveDadosPorPeriodo();
    const dados = dadosPorPeriodo[periodo] ?? dadosPorPeriodo['mes'];

    this.chartOptions.series = [
      {
        name: 'Recebido',
        data: dados.received
      },
      {
        name: 'A receber',
        data: dados.receivable
      },
      {
        name: 'Inadimplência',
        data: dados.overdue
      }
    ];

    this.chartOptions.xaxis = {
      type: 'category',
      categories: dados.categories
    };

    this.totalPeriodo = dados.total;
  }

  private resolveDadosPorPeriodo(): Record<BarChartPeriodKey, BarChartPeriodData> {
    return this.chartDataByPeriod || this.dadosPadraoPorPeriodo;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}
