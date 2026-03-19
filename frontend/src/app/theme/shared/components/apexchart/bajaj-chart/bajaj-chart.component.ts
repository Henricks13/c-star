// angular import
import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

// third party
import { NgApexchartsModule, ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-bajaj-chart',
  imports: [NgApexchartsModule],
  templateUrl: './bajaj-chart.component.html',
  styleUrl: './bajaj-chart.component.scss'
})
export class BajajChartComponent implements OnChanges {
  // public props
  @ViewChild('chart') chart!: ChartComponent;
  @Input() seriesData: number[] = [0, 15, 10, 50, 30, 40, 25];

  chartOptions!: Partial<ApexOptions>;

  // constructor
  constructor() {
    this.chartOptions = {
      chart: {
        type: 'area',
        height: 95,
        stacked: true,
        sparkline: {
          enabled: true
        },
        background: 'transparent'
      },
      stroke: {
        curve: 'smooth',
        width: 1
      },
      series: [
        {
          data: this.seriesData
        }
      ],
      tooltip: {
        theme: 'light',
        fixed: {
          enabled: false
        },
        x: {
          show: false
        },
        y: {
          title: {
            formatter: () => 'Ticket '
          }
        },
        marker: {
          show: false
        }
      },
      colors: ['#FFD700']
    };
  }

  ngOnChanges(_: SimpleChanges): void {
    if (!this.chartOptions) {
      return;
    }

    this.chartOptions.series = [
      {
        data: this.seriesData
      }
    ];
  }
}
