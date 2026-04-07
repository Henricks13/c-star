import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ClientOrdersService } from 'src/app/core/client-orders/client-orders.service';
import { ClientServiceOrderItem } from 'src/app/core/client-orders/client-orders.types';
import { ClientsService } from 'src/app/core/clients/clients.service';
import { ClientListItem } from 'src/app/core/clients/clients.types';
import { ClientObservationItem } from 'src/app/core/clients/clients.types';
import { FinanceService } from 'src/app/core/finance/finance.service';
import { FinanceIncomeItem } from 'src/app/core/finance/finance.types';
import { ProductItem } from 'src/app/core/products/products.types';
import { ProductsService } from 'src/app/core/products/products.service';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { NgSelectModule } from '@ng-select/ng-select';

type ClientChartTab = 'geral' | 'servicos' | 'observacoes';

interface ClientObservationTimelineItem {
  type: 'CLIENTE' | 'SERVICO';
  orderId: string;
  orderServiceStatus: string;
  orderPaymentStatus: string;
  createdAt: string;
  createdByName: string | null;
  note: string;
}

@Component({
  selector: 'app-client-chart',
  imports: [CommonModule, FormsModule, NgSelectModule, CardComponent],
  templateUrl: './client-chart.component.html',
  styleUrls: ['./client-chart.component.scss']
})
export class ClientChartComponent implements OnInit {
  private readonly ordersPageSize = 2;
  private shouldFocusObservationComposer = false;

  loading = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;

  activeTab: ClientChartTab = 'geral';

  clientId = '';
  client: ClientListItem | null = null;
  orders: ClientServiceOrderItem[] = [];

  allIncomes: FinanceIncomeItem[] = [];
  productCatalog: ProductItem[] = [];
  clientObservations: ClientObservationItem[] = [];
  observationTimelineItems: ClientObservationTimelineItem[] = [];

  incomesByOrderId = new Map<string, FinanceIncomeItem[]>();
  productPurchasePriceById = new Map<string, number>();

  savingObservation = false;
  isServiceObservation = false;
  newObservation = '';
  selectedObservationOrderId: string | null = null;
  observationErrorMessage: string | null = null;
  observationInfoMessage: string | null = null;

  inProgressPage = 0;
  budgetedPage = 0;
  completedPage = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly clientsService: ClientsService,
    private readonly clientOrdersService: ClientOrdersService,
    private readonly financeService: FinanceService,
    private readonly productsService: ProductsService
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('clientId') || '';
    if (!this.clientId) {
      this.errorMessage = 'Cliente inválido.';
      return;
    }

    const requestedTab = (this.route.snapshot.queryParamMap.get('tab') || '').trim().toLowerCase();
    if (requestedTab === 'servicos' || requestedTab === 'observacoes' || requestedTab === 'geral') {
      this.activeTab = requestedTab as ClientChartTab;
    }

    const shouldComposeObservation = (this.route.snapshot.queryParamMap.get('composeObservation') || '').trim().toLowerCase();
    if (shouldComposeObservation === '1' || shouldComposeObservation === 'true') {
      this.activeTab = 'observacoes';
      this.shouldFocusObservationComposer = true;
    }

    this.loadData();
  }

  get hasOrders(): boolean {
    return this.orders.length > 0;
  }

  get ordersInProgress(): ClientServiceOrderItem[] {
    return this.orders.filter((order) => order.serviceStatus === 'AGENDADO' || order.serviceStatus === 'AGUARDANDO_RETORNO');
  }

  get ordersBudgeted(): ClientServiceOrderItem[] {
    return this.orders.filter((order) => order.serviceStatus === 'ORCADO');
  }

  get ordersCompleted(): ClientServiceOrderItem[] {
    return this.orders.filter((order) => order.serviceStatus === 'FINALIZADO');
  }

  get observationEligibleOrders(): ClientServiceOrderItem[] {
    return this.orders;
  }

  get sortedOrdersInProgress(): ClientServiceOrderItem[] {
    return this.sortOrdersByMostRecent(this.ordersInProgress);
  }

  get sortedOrdersBudgeted(): ClientServiceOrderItem[] {
    return this.sortOrdersByMostRecent(this.ordersBudgeted);
  }

  get sortedOrdersCompleted(): ClientServiceOrderItem[] {
    return this.sortOrdersByMostRecent(this.ordersCompleted);
  }

  get pagedOrdersInProgress(): ClientServiceOrderItem[] {
    return this.getPageSlice(this.sortedOrdersInProgress, this.inProgressPage);
  }

  get pagedOrdersBudgeted(): ClientServiceOrderItem[] {
    return this.getPageSlice(this.sortedOrdersBudgeted, this.budgetedPage);
  }

  get pagedOrdersCompleted(): ClientServiceOrderItem[] {
    return this.getPageSlice(this.sortedOrdersCompleted, this.completedPage);
  }

  get inProgressTotalPages(): number {
    return this.getTotalPages(this.sortedOrdersInProgress.length);
  }

  get budgetedTotalPages(): number {
    return this.getTotalPages(this.sortedOrdersBudgeted.length);
  }

  get completedTotalPages(): number {
    return this.getTotalPages(this.sortedOrdersCompleted.length);
  }

  get totalPaidAmount(): number {
    return this.ordersForGeneralSummary.reduce((sum, order) => sum + this.getOrderPaidAmount(order), 0);
  }

  get totalOpenAmount(): number {
    return this.ordersForGeneralSummary.reduce((sum, order) => sum + this.getOrderOpenAmount(order), 0);
  }

  get totalProductCost(): number {
    return this.ordersForGeneralSummary.reduce((total, order) => {
      const orderCost = order.products.reduce((sum, product) => {
        const purchasePrice = this.productPurchasePriceById.get(product.productId);
        const unitCost = typeof purchasePrice === 'number' ? purchasePrice : product.salePrice;
        return sum + unitCost * Number(product.quantityUsed || 0);
      }, 0);

      return total + orderCost;
    }, 0);
  }

  get totalBilledAmount(): number {
    return this.ordersForGeneralSummary.reduce((sum, order) => sum + Number(order.finalTotal || 0), 0);
  }

  get estimatedProfitAmount(): number {
    return this.totalPaidAmount - this.totalProductCost;
  }

  get latestClientObservation(): ClientObservationTimelineItem | null {
    const first = this.observationTimelineItems[0];
    return first || null;
  }

  get ordersForGeneralSummary(): ClientServiceOrderItem[] {
    return this.orders.filter((order) => order.serviceStatus !== 'ORCADO');
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.clientsService.list().subscribe({
      next: (clients) => {
        this.client = clients.find((item) => item.id === this.clientId) || null;

        if (!this.client) {
          this.errorMessage = 'Cliente não encontrado.';
          this.loading = false;
          return;
        }

        forkJoin({
          orders: this.clientOrdersService.listByClient(this.clientId),
          clientObservations: this.clientsService.listObservations(this.clientId).pipe(catchError(() => of([] as ClientObservationItem[]))),
          incomes: this.financeService.listIncomes().pipe(catchError(() => of([] as FinanceIncomeItem[]))),
          products: this.productsService.list().pipe(catchError(() => of([] as ProductItem[])))
        }).subscribe({
          next: ({ orders, clientObservations, incomes, products }) => {
            this.orders = orders;
            if (!this.orders.length) {
              this.isServiceObservation = false;
              this.selectedObservationOrderId = null;
            }
            this.clientObservations = clientObservations;
            this.allIncomes = incomes;
            this.productCatalog = products;

            this.rebuildIncomeMap();
            this.rebuildProductCostMap();
            this.rebuildObservationsTimeline();
            this.ensureObservationOrderSelection();
            this.resetOrdersPagination();
            this.maybeFocusObservationComposer();

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

  setActiveTab(tab: ClientChartTab): void {
    this.activeTab = tab;
    this.maybeFocusObservationComposer();
  }

  previousInProgressPage(): void {
    if (this.inProgressPage > 0) {
      this.inProgressPage -= 1;
    }
  }

  nextInProgressPage(): void {
    if (this.inProgressPage < this.inProgressTotalPages - 1) {
      this.inProgressPage += 1;
    }
  }

  previousBudgetedPage(): void {
    if (this.budgetedPage > 0) {
      this.budgetedPage -= 1;
    }
  }

  nextBudgetedPage(): void {
    if (this.budgetedPage < this.budgetedTotalPages - 1) {
      this.budgetedPage += 1;
    }
  }

  previousCompletedPage(): void {
    if (this.completedPage > 0) {
      this.completedPage -= 1;
    }
  }

  nextCompletedPage(): void {
    if (this.completedPage < this.completedTotalPages - 1) {
      this.completedPage += 1;
    }
  }

  openServicesFromObservation(observation: ClientObservationTimelineItem): void {
    if (observation.type !== 'SERVICO' || !this.clientId) {
      return;
    }

    this.router.navigate(['/clients/services'], {
      queryParams: {
        clientId: this.clientId,
        orderId: observation.orderId || null
      }
    });
  }

  openServiceForEdit(orderId: string | null | undefined): void {
    if (!this.clientId || !(orderId || '').trim()) {
      return;
    }

    this.router.navigate(['/clients/services'], {
      queryParams: {
        clientId: this.clientId,
        orderId,
        openWizard: '1'
      }
    });
  }

  openServicesScreen(orderId: string | null | undefined): void {
    if (!this.clientId) {
      return;
    }

    this.router.navigate(['/clients/services'], {
      queryParams: {
        clientId: this.clientId,
        orderId: (orderId || '').trim() || null
      }
    });
  }

  addObservation(): void {
    if (this.savingObservation) {
      return;
    }

    const note = (this.newObservation || '').trim();
    if (!note) {
      this.observationErrorMessage = 'Digite a observação antes de salvar.';
      return;
    }

    this.savingObservation = true;
    this.observationErrorMessage = null;
    this.observationInfoMessage = null;

    if (this.isServiceObservation) {
      const orderId = this.selectedObservationOrderId;
      if (!orderId) {
        this.observationErrorMessage = 'Selecione um serviço para registrar a observação.';
        this.savingObservation = false;
        return;
      }

      this.clientOrdersService.addObservation(orderId, { note }).subscribe({
        next: (updatedOrder) => {
          this.orders = this.orders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order));
          this.rebuildObservationsTimeline();
          this.newObservation = '';
          this.observationInfoMessage = 'Observação de serviço registrada com sucesso.';
          this.savingObservation = false;
        },
        error: (error) => {
          this.observationErrorMessage = error?.error?.message || 'Não foi possível registrar a observação de serviço.';
          this.savingObservation = false;
        }
      });

      return;
    }

    this.clientsService.addObservation(this.clientId, { note }).subscribe({
      next: (createdObservation) => {
        this.clientObservations = [createdObservation, ...this.clientObservations];
        this.rebuildObservationsTimeline();
        this.newObservation = '';
        this.observationInfoMessage = 'Observação da cliente registrada com sucesso.';
        this.savingObservation = false;
      },
      error: (error) => {
        this.observationErrorMessage = error?.error?.message || 'Não foi possível registrar a observação da cliente.';
        this.savingObservation = false;
      }
    });
  }

  setObservationMode(isServiceObservation: boolean): void {
    if (isServiceObservation && !this.hasOrders) {
      this.isServiceObservation = false;
      this.selectedObservationOrderId = null;
      return;
    }

    this.isServiceObservation = isServiceObservation;
    this.observationErrorMessage = null;
    this.observationInfoMessage = null;
    if (isServiceObservation) {
      this.selectedObservationOrderId = null;
      this.ensureObservationOrderSelection();
    }
  }

  getOrderPaidAmount(order: ClientServiceOrderItem): number {
    const incomes = this.incomesByOrderId.get(order.id) || [];
    if (incomes.length > 0) {
      return incomes.filter((item) => item.paymentStatus === 'PAGO').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }

    const total = Number(order.finalTotal || 0);
    if (order.paymentStatus === 'PAGAMENTO_CONCLUIDO') {
      return total;
    }

    if (order.paymentStatus === 'PAGAMENTO_PARCIAL') {
      const paidInstallments = Number(order.paidInstallmentCount || 0);
      const installmentCount = Number(order.installmentCount || 0);
      if (installmentCount > 0) {
        return (total / installmentCount) * paidInstallments;
      }

      return total * 0.5;
    }

    return 0;
  }

  getOrderOpenAmount(order: ClientServiceOrderItem): number {
    const incomes = this.incomesByOrderId.get(order.id) || [];
    if (incomes.length > 0) {
      const openByIncomes = incomes.filter((item) => item.paymentStatus !== 'PAGO').reduce((sum, item) => sum + Number(item.amount || 0), 0);
      if (openByIncomes > 0) {
        return openByIncomes;
      }
    }

    const fallback = Number(order.finalTotal || 0) - this.getOrderPaidAmount(order);
    return fallback > 0 ? fallback : 0;
  }

  getOrderNextPaymentDate(order: ClientServiceOrderItem): string | null {
    const incomes = this.incomesByOrderId.get(order.id) || [];
    if (incomes.length === 0) {
      return null;
    }

    const next = incomes
      .filter((item) => item.paymentStatus !== 'PAGO')
      .sort((first, second) => new Date(first.occurredOn).getTime() - new Date(second.occurredOn).getTime())[0];

    return next?.occurredOn || null;
  }

  getOrderLastObservation(order: ClientServiceOrderItem): ClientObservationTimelineItem | null {
    const obs = (order.observations || [])
      .map((item) => ({
        type: 'SERVICO' as const,
        orderId: order.id,
        orderServiceStatus: order.serviceStatus,
        orderPaymentStatus: order.paymentStatus,
        createdAt: item.createdAt,
        createdByName: item.createdByName,
        note: item.note
      }))
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())[0];

    return obs || null;
  }

  getObservationAuthorLabel(authorName: string | null | undefined): string {
    return (authorName || '').trim() || 'Não informado';
  }

  getOrderSummaryLabel(order: ClientServiceOrderItem): string {
    return `#${this.getOrderDisplayId(order.id)} • ${this.getServiceFlowStatusLabel(order)}`;
  }

  getObservationOrderDetailLabel(order: ClientServiceOrderItem): string {
    const serviceLabel = this.getOrderServicesShortLabel(order);
    const valueLabel = Number(order.finalTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const statusLabel = this.getServiceFlowStatusLabel(order);
    const createdAtLabel = this.formatDateTime(order.createdAt);
    return `Serviço: ${serviceLabel} | Criado em: ${createdAtLabel} | Valor: ${valueLabel} | Status: ${statusLabel}`;
  }

  getOrderServicesShortLabel(order: ClientServiceOrderItem): string {
    if (!order.services?.length) {
      return 'Sem serviços definidos';
    }

    const names = order.services.map((item) => item.serviceName).filter((name) => !!name);
    if (!names.length) {
      return 'Serviço sem nome';
    }

    const first = names[0];
    const extraCount = names.length - 1;
    return extraCount > 0 ? `${first} +${extraCount}` : first;
  }

  getOrderProductCost(order: ClientServiceOrderItem): number {
    return order.products.reduce((sum, product) => {
      const purchasePrice = this.productPurchasePriceById.get(product.productId);
      const unitCost = typeof purchasePrice === 'number' ? purchasePrice : product.salePrice;
      return sum + unitCost * Number(product.quantityUsed || 0);
    }, 0);
  }

  getOrderPotentialProfit(order: ClientServiceOrderItem): number {
    return Number(order.finalTotal || 0) - this.getOrderProductCost(order);
  }

  getOrderDisplayId(orderId: string | null | undefined): string {
    if (!orderId) {
      return '—';
    }

    return orderId.split('-')[0] || orderId;
  }

  getObservationTargetLabel(observation: ClientObservationTimelineItem): string {
    if (observation.type === 'CLIENTE') {
      return 'Cliente';
    }

    const order = this.orders.find((item) => item.id === observation.orderId);
    if (order) {
      const createdAtLabel = this.formatDateTime(order.createdAt);
      return `Serviço: ${this.getOrderServicesShortLabel(order)} • ${createdAtLabel}`;
    }

    return 'Serviço';
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

    if (normalized === 'LEAD_TRAFEGO_PAGO') {
      return 'Lead Tráfego Pago';
    }
    if (normalized === 'INDICACAO') {
      return 'Indicação';
    }
    if (normalized === 'PACIENTE_ANTIGO') {
      return 'Paciente Antigo';
    }
    if (normalized === 'REDES_SOCIAIS') {
      return 'Redes Sociais';
    }
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

  private rebuildIncomeMap(): void {
    this.incomesByOrderId.clear();

    this.allIncomes
      .filter((income) => income.source === 'SERVICE_ORDER' && !!income.referenceId)
      .forEach((income) => {
        const orderId = income.referenceId as string;
        const list = this.incomesByOrderId.get(orderId) || [];
        list.push(income);
        this.incomesByOrderId.set(orderId, list);
      });
  }

  private rebuildProductCostMap(): void {
    this.productPurchasePriceById.clear();
    this.productCatalog.forEach((product) => {
      this.productPurchasePriceById.set(product.id, Number(product.purchasePrice || 0));
    });
  }

  private maybeFocusObservationComposer(): void {
    if (!this.shouldFocusObservationComposer || this.activeTab !== 'observacoes') {
      return;
    }

    this.shouldFocusObservationComposer = false;

    if (typeof document === 'undefined') {
      return;
    }

    setTimeout(() => {
      const card = document.getElementById('newObservationCard');
      card?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const field = document.getElementById('newObservationField') as HTMLTextAreaElement | null;
      field?.focus();
    }, 0);
  }

  private rebuildObservationsTimeline(): void {
    const serviceTimeline = this.orders.flatMap((order) =>
      (order.observations || []).map((observation) => ({
        type: 'SERVICO' as const,
        orderId: order.id,
        orderServiceStatus: order.serviceStatus,
        orderPaymentStatus: order.paymentStatus,
        createdAt: observation.createdAt,
        createdByName: observation.createdByName,
        note: observation.note
      }))
    );

    const clientTimeline = this.clientObservations.map((observation) => ({
      type: 'CLIENTE' as const,
      orderId: '',
      orderServiceStatus: '',
      orderPaymentStatus: '',
      createdAt: observation.createdAt,
      createdByName: observation.createdByName,
      note: observation.note
    }));

    this.observationTimelineItems = [...serviceTimeline, ...clientTimeline].sort(
      (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );
  }

  private ensureObservationOrderSelection(): void {
    if (!this.observationEligibleOrders.length) {
      this.selectedObservationOrderId = null;
      return;
    }

    const current = this.selectedObservationOrderId;
    const stillValid = current && this.observationEligibleOrders.some((item) => item.id === current);
    if (!stillValid) {
      this.selectedObservationOrderId = null;
    }
  }

  private formatDateTime(rawValue: string | null | undefined): string {
    if (!rawValue) {
      return '-';
    }

    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return parsed.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private sortOrdersByMostRecent(orders: ClientServiceOrderItem[]): ClientServiceOrderItem[] {
    return [...orders].sort((first, second) => this.parseDateTime(second.createdAt) - this.parseDateTime(first.createdAt));
  }

  private getPageSlice(orders: ClientServiceOrderItem[], page: number): ClientServiceOrderItem[] {
    const safePage = page < 0 ? 0 : page;
    const start = safePage * this.ordersPageSize;
    return orders.slice(start, start + this.ordersPageSize);
  }

  private getTotalPages(totalItems: number): number {
    if (totalItems <= 0) {
      return 0;
    }

    return Math.ceil(totalItems / this.ordersPageSize);
  }

  private resetOrdersPagination(): void {
    this.inProgressPage = 0;
    this.budgetedPage = 0;
    this.completedPage = 0;
  }

  private parseDateTime(rawValue: string | null | undefined): number {
    if (!rawValue) {
      return 0;
    }

    const parsed = new Date(rawValue).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
