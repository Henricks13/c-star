import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ClientOrdersService } from 'src/app/core/client-orders/client-orders.service';
import { ClientServiceOrderItem } from 'src/app/core/client-orders/client-orders.types';
import { ClientsService } from 'src/app/core/clients/clients.service';
import { ClientListItem } from 'src/app/core/clients/clients.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-client-chart',
  imports: [CommonModule, CardComponent],
  templateUrl: './client-chart.component.html',
  styleUrls: ['./client-chart.component.scss']
})
export class ClientChartComponent implements OnInit {
  loading = false;
  errorMessage: string | null = null;

  clientId = '';
  client: ClientListItem | null = null;
  orders: ClientServiceOrderItem[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly clientsService: ClientsService,
    private readonly clientOrdersService: ClientOrdersService
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('clientId') || '';
    if (!this.clientId) {
      this.errorMessage = 'Cliente inválido.';
      return;
    }

    this.loadData();
  }

  get hasOrders(): boolean {
    return this.orders.length > 0;
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = null;

    this.clientsService.list().subscribe({
      next: (clients) => {
        this.client = clients.find((item) => item.id === this.clientId) || null;

        if (!this.client) {
          this.errorMessage = 'Cliente não encontrado.';
          this.loading = false;
          return;
        }

        this.clientOrdersService.listByClient(this.clientId).subscribe({
          next: (orders) => {
            this.orders = orders;
            this.loading = false;
          },
          error: () => {
            this.errorMessage = 'Não foi possível carregar os serviços deste cliente.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os dados do cliente.';
        this.loading = false;
      }
    });
  }

  openServiceShortcut(): void {
    if (!this.clientId) {
      return;
    }

    this.router.navigate(['/clients/services'], {
      queryParams: {
        clientId: this.clientId,
        openWizard: '1'
      }
    });
  }

  goBackToClients(): void {
    this.router.navigate(['/clients']);
  }

  getServiceFlowStatusLabel(order: ClientServiceOrderItem): string {
    if (order.serviceStatus === 'ORCADO') {
      return 'Aguardando agendamento';
    }
    if (order.serviceStatus === 'AGUARDANDO_RETORNO') {
      return 'Aguardando retorno';
    }
    if (order.serviceStatus === 'FINALIZADO') {
      return 'Finalizado';
    }

    return 'Agendado';
  }

  getPaymentStatusLabel(order: ClientServiceOrderItem): string {
    if (order.paymentStatus === 'ORCADO') {
      return 'Orçado';
    }

    if (order.paymentStatus === 'PAGAMENTO_CONCLUIDO') {
      return 'Pagamento concluído';
    }

    if (order.paymentStatus === 'PAGAMENTO_PARCIAL') {
      return 'Pagamento parcial';
    }

    return 'Aguardando pagamento';
  }

  getOriginLabel(origin: string | null | undefined): string {
    const normalized = (origin || '').trim().toUpperCase();

    if (normalized === 'CADASTRO_MANUAL') {
      return 'Cadastrado Manual';
    }
    if (normalized === 'CADASTRO_INDICADO') {
      return 'Cadastrado Indicado';
    }
    if (normalized === 'RESGATE') {
      return 'Resgate';
    }
    if (normalized === 'OUTROS') {
      return 'Outros';
    }

    return 'Não informado';
  }

  getBusinessStatusLabel(status: string | null | undefined): string {
    const normalized = (status || '').trim().toUpperCase();

    if (normalized === 'NEGOCIO_FECHADO') {
      return 'Negócio fechado';
    }

    if (normalized === 'AVALIACAO_MARCADA') {
      return 'Avaliação marcada';
    }

    return 'Negociação';
  }
}
