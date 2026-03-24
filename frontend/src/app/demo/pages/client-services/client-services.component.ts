import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from 'src/app/core/auth/auth.service';
import { ClientOrdersService } from 'src/app/core/client-orders/client-orders.service';
import {
  ClientServiceOrderItem,
  ClientServiceOrderPaymentStatus,
  ClientServiceOrderStatus,
  ConfirmClientServiceOrderPaymentRequest,
  CreateClientServiceOrderRequest,
  ServicePaymentMethod
} from 'src/app/core/client-orders/client-orders.types';
import { ClientsService } from 'src/app/core/clients/clients.service';
import { ClientListItem } from 'src/app/core/clients/clients.types';
import { FinanceService } from 'src/app/core/finance/finance.service';
import { FinanceIncomeItem } from 'src/app/core/finance/finance.types';
import { ProductItem } from 'src/app/core/products/products.types';
import { ProductsService } from 'src/app/core/products/products.service';
import { ServiceItem } from 'src/app/core/services/services.types';
import { ServicesService } from 'src/app/core/services/services.service';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { ConfirmActionModalComponent } from 'src/app/theme/shared/components/confirm-action-modal/confirm-action-modal.component';

interface ExtraProductRow {
  productId: string;
  quantityUsed: number;
}

type PaymentPlanSelection = ServicePaymentMethod | 'CUSTOM_SPLIT';

@Component({
  selector: 'app-client-services',
  imports: [CommonModule, FormsModule, NgSelectModule, CardComponent, ConfirmActionModalComponent],
  templateUrl: './client-services.component.html',
  styleUrls: ['./client-services.component.scss']
})
export class ClientServicesComponent implements OnInit {
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;

  orders: ClientServiceOrderItem[] = [];
  clients: ClientListItem[] = [];
  availableServices: ServiceItem[] = [];
  availableProducts: ProductItem[] = [];

  selectedStatus: '' | ClientServiceOrderStatus = '';
  searchTerm = '';

  createWizardOpen = false;
  createWizardStep = 1;
  createWizardLoading = false;
  selectedClientId = '';
  serviceOrderId: string | null = null;
  selectedServiceIds: string[] = [''];
  extraProductRows: ExtraProductRow[] = [];
  wizardNotes = '';
  wizardDiscountAmount = 0;
  wizardCustomTotalEnabled = false;
  wizardCustomTotalValue: number | null = null;
  paymentMethod: ServicePaymentMethod = 'PIX';
  paymentInstallmentCount = 1;
  paymentPaid = false;
  paymentFirstInstallmentPaid = false;
  wizardServiceStatus: ClientServiceOrderStatus | null = null;

  detailsModalOpen = false;
  selectedOrderForDetails: ClientServiceOrderItem | null = null;

  serviceManagementModalOpen = false;
  selectedOrderForManagement: ClientServiceOrderItem | null = null;
  serviceManagementObservation = '';
  serviceManagementScheduleAt = '';
  serviceManagementReturnAt = '';
  deleteServiceOrderModalOpen = false;
  selectedOrderForDeletion: ClientServiceOrderItem | null = null;
  paymentModalOpen = false;
  selectedOrderForPayment: ClientServiceOrderItem | null = null;
  paymentModalErrorMessage: string | null = null;
  paymentModalInfoMessage: string | null = null;
  paymentInvoices: FinanceIncomeItem[] = [];
  paymentInvoiceConfirmModalOpen = false;
  selectedInvoiceForPaymentConfirm: FinanceIncomeItem | null = null;
  paymentPlanLoading = false;
  paymentPlanSelection: PaymentPlanSelection = 'PIX';
  paymentPlanMethod: ServicePaymentMethod = 'PIX';
  paymentPlanInstallments = 1;
  paymentPlanDownPaymentEnabled = false;
  paymentPlanDownPaymentAmount: number | null = null;
  paymentPlanCustomSplitEnabled = false;
  paymentPlanDownPaymentMethod: ServicePaymentMethod = 'PIX';
  paymentPlanRemainingPaymentMethod: ServicePaymentMethod = 'CREDIT_CARD';
  routeClientId: string | null = null;
  routeOpenWizard = false;

  readonly paymentMethodOptions: Array<{ value: ServicePaymentMethod; label: string }> = [
    { value: 'PIX', label: 'Pix' },
    { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
    { value: 'PIX_INSTALLMENT', label: 'Pix parcelado' },
    { value: 'CASH', label: 'Dinheiro' },
    { value: 'TRADE', label: 'Troca' }
  ];

  readonly installmentOptions: Array<{ value: number; label: string }> = Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: index === 0 ? 'a vista' : `${index + 1}x`
  }));

  ngOnInit(): void {
    this.loadInitialData();
  }

  constructor(
    private readonly clientOrdersService: ClientOrdersService,
    private readonly clientsService: ClientsService,
    private readonly servicesService: ServicesService,
    private readonly productsService: ProductsService,
    private readonly financeService: FinanceService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  get selectedClient(): ClientListItem | null {
    return this.clients.find((item) => item.id === this.selectedClientId) || null;
  }

  get selectedServices(): ServiceItem[] {
    const selected = new Set(this.selectedServiceIds.filter((id) => !!id));
    return this.availableServices.filter((service) => selected.has(service.id));
  }

  get requiredServiceProducts(): Array<{ product: ProductItem; requiredQty: number; availableQty: number; enough: boolean }> {
    const requiredMap = new Map<string, number>();

    for (const service of this.selectedServices) {
      for (const productUsage of service.consumedProducts || []) {
        const current = requiredMap.get(productUsage.productId) || 0;
        requiredMap.set(productUsage.productId, current + Number(productUsage.quantityUsed || 0));
      }
    }

    const allRows = Array.from(requiredMap.entries()).map(([productId, requiredQty]) => {
      const product = this.availableProducts.find((item) => item.id === productId);
      const availableQty = Number(product?.stockQuantity || 0);

      return {
        product: product as ProductItem,
        requiredQty,
        availableQty,
        enough: !!product && availableQty >= requiredQty
      };
    });

    return allRows.filter((row) => !!row.product);
  }

  get hasSufficientStock(): boolean {
    if (this.requiredServiceProducts.some((row) => !row.enough)) {
      return false;
    }

    for (const row of this.extraProductRows) {
      if (!row.productId) {
        continue;
      }

      const product = this.availableProducts.find((item) => item.id === row.productId);
      if (!product) {
        return false;
      }

      const availableQty = Number(product.stockQuantity || 0);
      const requiredQty = Number(row.quantityUsed || 0);
      if (requiredQty <= 0 || availableQty < requiredQty) {
        return false;
      }
    }

    return true;
  }

  get subtotalServices(): number {
    return this.selectedServices.reduce((sum, service) => sum + Number(service.price || 0), 0);
  }

  get subtotalExtraProducts(): number {
    return this.extraProductRows.reduce((sum, row) => {
      if (!row.productId || !row.quantityUsed || row.quantityUsed <= 0) {
        return sum;
      }

      const product = this.availableProducts.find((item) => item.id === row.productId);
      if (!product) {
        return sum;
      }

      return sum + Number(product.salePrice || 0) * Number(row.quantityUsed);
    }, 0);
  }

  get calculatedTotal(): number {
    if (this.wizardCustomTotalEnabled) {
      return Number(this.wizardCustomTotalValue || 0);
    }

    const discount = Number(this.wizardDiscountAmount || 0);
    return this.subtotalServices + this.subtotalExtraProducts - discount;
  }

  get requiresInstallments(): boolean {
    return this.paymentMethod === 'CREDIT_CARD' || this.paymentMethod === 'PIX_INSTALLMENT';
  }

  get paymentPlanAllowsInstallments(): boolean {
    return this.paymentPlanMethod === 'CREDIT_CARD' || this.paymentPlanMethod === 'PIX_INSTALLMENT';
  }

  get paymentPlanEffectiveMethod(): ServicePaymentMethod {
    return this.paymentPlanCustomSplitEnabled ? this.paymentPlanRemainingPaymentMethod : this.paymentPlanMethod;
  }

  get paymentPlanEffectiveAllowsInstallments(): boolean {
    const method = this.paymentPlanEffectiveMethod;
    return method === 'CREDIT_CARD' || method === 'PIX_INSTALLMENT';
  }

  get isWizardWaitingScheduling(): boolean {
    return this.wizardServiceStatus === 'ORCADO';
  }

  get canConfirmPaymentInWizard(): boolean {
    return !this.isWizardWaitingScheduling;
  }

  canDeleteServiceOrders(): boolean {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }

    const email = (user.email || '').trim().toLowerCase();
    if (email === 'carol@gmail.com') {
      return true;
    }

    const roles = (user.roles || []).map((role) => (role || '').trim().toUpperCase());
    return roles.includes('DEV_SUPORTE') || roles.includes('MASTER_ADMIN');
  }

  get filteredOrders(): ClientServiceOrderItem[] {
    const normalizedSearch = (this.searchTerm || '').trim().toLowerCase();

    return this.orders.filter((order) => {
      const matchesStatus = !this.selectedStatus || order.serviceStatus === this.selectedStatus;
      const matchesSearch =
        !normalizedSearch ||
        (order.clientName || '').toLowerCase().includes(normalizedSearch) ||
        (order.notes || '').toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }

  get hasPaymentInvoices(): boolean {
    return this.paymentInvoices.length > 0;
  }

  get paymentTotalInvoiced(): number {
    return this.paymentInvoices.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  }

  get paymentTotalPaid(): number {
    return this.paymentInvoices
      .filter((item) => item.paymentStatus === 'PAGO')
      .reduce((acc, item) => acc + Number(item.amount || 0), 0);
  }

  get paymentTotalPending(): number {
    return this.paymentTotalInvoiced - this.paymentTotalPaid;
  }

  loadInitialData(): void {
    this.loading = true;
    this.errorMessage = null;

    this.routeClientId = this.route.snapshot.queryParamMap.get('clientId');
    this.routeOpenWizard = this.route.snapshot.queryParamMap.get('openWizard') === '1';

    this.clientsService.list().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.servicesService.list().subscribe({
          next: (services) => {
            this.availableServices = services.filter((item) => item.active);
            this.productsService.list().subscribe({
              next: (products) => {
                this.availableProducts = products.filter((item) => item.active);
                this.applyRouteShortcut();
                this.loadOrders();
              },
              error: () => {
                this.errorMessage = 'Não foi possível carregar produtos.';
                this.loading = false;
              }
            });
          },
          error: () => {
            this.errorMessage = 'Não foi possível carregar serviços disponíveis.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar clientes.';
        this.loading = false;
      }
    });
  }

  loadOrders(): void {
    if (!this.loading) {
      this.loading = true;
    }
    this.errorMessage = null;

    this.clientOrdersService.listAll().subscribe({
      next: (response) => {
        this.orders = response;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os serviços.';
        this.loading = false;
      }
    });
  }

  openCreateWizard(): void {
    this.resetCreateWizard();
    this.createWizardOpen = true;
  }

  private applyRouteShortcut(): void {
    if (!this.routeClientId) {
      return;
    }

    const hasClient = this.clients.some((item) => item.id === this.routeClientId);
    if (!hasClient) {
      return;
    }

    if (this.routeOpenWizard) {
      this.openCreateWizard();
    }

    this.selectedClientId = this.routeClientId;
    this.routeClientId = null;
    this.routeOpenWizard = false;
  }

  closeCreateWizard(): void {
    this.createWizardOpen = false;
    this.createWizardLoading = false;
    this.serviceOrderId = null;
    this.wizardServiceStatus = null;
  }

  goToWizardStep(step: number): void {
    if (step === 2 && (!this.selectedClientId || this.selectedServices.length === 0)) {
      this.errorMessage = 'Selecione cliente e ao menos um serviço para continuar.';
      return;
    }

    if (step === 3) {
      if (!this.selectedClientId || this.selectedServices.length === 0) {
        this.errorMessage = 'Selecione cliente e ao menos um serviço para continuar.';
        return;
      }

      if (!this.hasSufficientStock) {
        this.errorMessage = 'Estoque insuficiente para fechar este orçamento.';
        return;
      }
    }

    if (step === 4) {
      if (this.serviceOrderId && this.selectedOrderForPayment) {
        this.errorMessage = null;
        this.createWizardStep = 4;
        this.loadPaymentInvoices();
        return;
      }
      this.saveBudget(true);
      return;
    }

    this.errorMessage = null;
    this.createWizardStep = step;
  }

  addServiceRow(): void {
    this.selectedServiceIds.push('');
  }

  removeServiceRow(index: number): void {
    if (this.selectedServiceIds.length === 1) {
      this.selectedServiceIds = [''];
      return;
    }

    this.selectedServiceIds.splice(index, 1);
    if (this.selectedServiceIds.length === 0) {
      this.selectedServiceIds = [''];
    }
  }

  onServiceSelectionChange(index: number, serviceId: string | null | undefined): void {
    const nextServiceId = (serviceId || '').toString();

    if (nextServiceId && this.selectedServiceIds.some((selectedId, selectedIndex) => selectedIndex !== index && selectedId === nextServiceId)) {
      this.infoMessage = 'Este serviço já foi adicionado na lista.';
      return;
    }

    this.selectedServiceIds[index] = nextServiceId;
  }

  getServicePrice(serviceId: string): number {
    if (!serviceId) {
      return 0;
    }

    const service = this.availableServices.find((item) => item.id === serviceId);
    return Number(service?.price || 0);
  }

  addExtraProductRow(): void {
    this.extraProductRows.push({
      productId: '',
      quantityUsed: 1
    });
  }

  removeExtraProductRow(index: number): void {
    this.extraProductRows.splice(index, 1);
  }

  saveBudget(moveToPaymentStep = false): void {
    if (!this.selectedClientId) {
      this.errorMessage = 'Selecione um cliente antes de salvar o orçamento.';
      return;
    }

    if (this.selectedServices.length === 0) {
      this.errorMessage = 'Selecione ao menos um serviço para fechar o orçamento.';
      return;
    }

    if (!this.hasSufficientStock) {
      this.errorMessage = 'Estoque insuficiente para salvar este orçamento.';
      return;
    }

    const discount = Number(this.wizardDiscountAmount || 0);
    if (!this.wizardCustomTotalEnabled && discount < 0) {
      this.errorMessage = 'Desconto inválido.';
      return;
    }

    if (this.wizardCustomTotalEnabled && Number(this.wizardCustomTotalValue || 0) < 0) {
      this.errorMessage = 'Total personalizado inválido.';
      return;
    }

    const payload: CreateClientServiceOrderRequest = {
      clientId: this.selectedClientId,
      serviceIds: this.selectedServices.map((service) => service.id),
      extraProducts: this.extraProductRows
        .filter((row) => row.productId && Number(row.quantityUsed) > 0)
        .map((row) => ({
          productId: row.productId,
          quantityUsed: Number(row.quantityUsed)
        })),
      discountAmount: discount,
      customTotalEnabled: this.wizardCustomTotalEnabled,
      customTotalValue: this.wizardCustomTotalEnabled ? Number(this.wizardCustomTotalValue || 0) : null,
      notes: (this.wizardNotes || '').trim() || null
    };

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.clientOrdersService.create(payload).subscribe({
      next: (order) => {
        this.serviceOrderId = order.id;
        this.wizardServiceStatus = order.serviceStatus;
        this.hydratePaymentContextFromOrder(order);
        this.saving = false;
        this.errorMessage = null;
        this.infoMessage = moveToPaymentStep
          ? 'Orçamento salvo. Configure as faturas no passo de pagamento.'
          : 'Orçamento salvo com sucesso.';
        if (moveToPaymentStep) {
          this.createWizardStep = 4;
          this.loadPaymentInvoices();
        }
        this.loadOrders();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível salvar o orçamento do cliente.';
        this.infoMessage = null;
        this.saving = false;
      }
    });
  }

  confirmServicePayment(): void {
    if (!this.serviceOrderId) {
      this.errorMessage = 'Salve o orçamento antes de confirmar pagamento.';
      return;
    }

    if (!this.canConfirmPaymentInWizard) {
      this.errorMessage = 'Agende o serviço antes de confirmar pagamento.';
      return;
    }

    if (!this.paymentInstallmentCount || this.paymentInstallmentCount < 1 || this.paymentInstallmentCount > 12) {
      this.errorMessage = 'Informe parcelas entre 1 e 12.';
      return;
    }

    if (this.requiresInstallments && this.paymentInstallmentCount > 1 && this.paymentPaid) {
      this.errorMessage = 'Para parcelado, não é possível marcar como pago total.';
      return;
    }

    if (this.paymentPaid) {
      this.paymentFirstInstallmentPaid = false;
    }

    const payload: ConfirmClientServiceOrderPaymentRequest = {
      paymentMethod: this.paymentMethod,
      installmentCount: this.requiresInstallments ? Number(this.paymentInstallmentCount || 1) : 1,
      paid: this.paymentPaid,
      firstInstallmentPaid: this.requiresInstallments && Number(this.paymentInstallmentCount || 1) > 1 && !this.paymentPaid ? this.paymentFirstInstallmentPaid : false
    };

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.clientOrdersService.confirmPayment(this.serviceOrderId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.infoMessage = 'Pagamento atualizado e financeiro lançado conforme parcelas pagas.';
        this.closeCreateWizard();
        this.loadOrders();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível confirmar o pagamento.';
        this.saving = false;
      }
    });
  }

  onPaymentMethodChange(method: ServicePaymentMethod): void {
    this.paymentMethod = method;

    if (!this.requiresInstallments) {
      this.paymentInstallmentCount = 1;
      this.paymentPaid = false;
      this.paymentFirstInstallmentPaid = false;
      return;
    }

    if (this.paymentInstallmentCount < 1 || this.paymentInstallmentCount > 12) {
      this.paymentInstallmentCount = 1;
    }

    this.syncPaymentFlags();
  }

  onInstallmentCountChange(): void {
    if (!this.requiresInstallments) {
      this.paymentInstallmentCount = 1;
      this.paymentPaid = false;
      this.paymentFirstInstallmentPaid = false;
      return;
    }

    if (!this.paymentInstallmentCount || this.paymentInstallmentCount < 1 || this.paymentInstallmentCount > 12) {
      this.paymentInstallmentCount = 1;
    }

    this.syncPaymentFlags();
  }

  openOrderDetails(order: ClientServiceOrderItem): void {
    this.selectedOrderForDetails = order;
    this.detailsModalOpen = true;
  }

  closeOrderDetails(): void {
    this.detailsModalOpen = false;
    this.selectedOrderForDetails = null;
  }

  openServiceManagement(order: ClientServiceOrderItem): void {
    this.selectedOrderForManagement = order;
    this.serviceManagementModalOpen = true;
    this.serviceManagementObservation = '';
    const scheduleBase = order.scheduledAt ? new Date(order.scheduledAt) : this.addDaysFromNow(1);
    this.serviceManagementScheduleAt = this.toDateTimeLocalInput(scheduleBase);
    const returnBase = this.resolveReturnBaseDate(order);
    this.serviceManagementReturnAt = this.toDateTimeLocalInput(returnBase);
    this.errorMessage = null;
    this.infoMessage = null;
  }

  openScheduleAction(order: ClientServiceOrderItem): void {
    this.openServiceManagement(order);
  }

  openReturnAction(order: ClientServiceOrderItem): void {
    this.openServiceManagement(order);
  }

  openScheduleFromDetails(): void {
    if (!this.selectedOrderForDetails) {
      return;
    }

    this.openScheduleAction(this.selectedOrderForDetails);
    this.closeOrderDetails();
  }

  openReturnFromDetails(): void {
    if (!this.selectedOrderForDetails) {
      return;
    }

    this.openReturnAction(this.selectedOrderForDetails);
    this.closeOrderDetails();
  }

  closeServiceManagementModal(): void {
    this.serviceManagementModalOpen = false;
    this.selectedOrderForManagement = null;
    this.serviceManagementObservation = '';
    this.serviceManagementScheduleAt = '';
  }

  scheduleService(): void {
    if (!this.selectedOrderForManagement || this.saving) {
      return;
    }

    if (!this.serviceManagementScheduleAt) {
      this.errorMessage = 'Informe data e hora do agendamento.';
      return;
    }

    const scheduledAt = new Date(this.serviceManagementScheduleAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      this.errorMessage = 'Data/hora de agendamento inválida.';
      return;
    }

    if (scheduledAt.getTime() < Date.now()) {
      this.errorMessage = 'O agendamento deve ser de hoje em diante.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.clientOrdersService.scheduleService(this.selectedOrderForManagement.id, { scheduledAt: scheduledAt.toISOString() }).subscribe({
      next: (updated) => {
        this.replaceOrder(updated);
        this.selectedOrderForManagement = updated;
        this.saving = false;
        this.infoMessage = 'Serviço agendado e evento criado na agenda.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível agendar o serviço.';
        this.saving = false;
      }
    });
  }

  addServiceObservation(): void {
    if (!this.selectedOrderForManagement || this.saving) {
      return;
    }

    const note = (this.serviceManagementObservation || '').trim();
    if (!note) {
      this.errorMessage = 'Informe a observação para salvar.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.clientOrdersService.addObservation(this.selectedOrderForManagement.id, { note }).subscribe({
      next: (updated) => {
        this.replaceOrder(updated);
        this.selectedOrderForManagement = updated;
        this.serviceManagementObservation = '';
        this.saving = false;
        this.infoMessage = 'Observação registrada com sucesso.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível registrar a observação.';
        this.saving = false;
      }
    });
  }

  scheduleServiceReturn(): void {
    if (!this.selectedOrderForManagement || this.saving) {
      return;
    }

    if (this.hasPendingReturn(this.selectedOrderForManagement)) {
      const nextReturn = this.selectedOrderForManagement.nextReturnAt ? new Date(this.selectedOrderForManagement.nextReturnAt) : null;
      const nextReturnLabel = nextReturn ? this.formatDateTime(nextReturn) : 'a data já registrada';
      this.errorMessage = `Já existe um retorno agendado para ${nextReturnLabel}.`;
      return;
    }

    if (!this.serviceManagementReturnAt) {
      this.errorMessage = 'Informe data e hora do retorno.';
      return;
    }

    const returnAt = new Date(this.serviceManagementReturnAt);
    if (Number.isNaN(returnAt.getTime())) {
      this.errorMessage = 'Data/hora de retorno inválida.';
      return;
    }

    if (returnAt.getTime() < Date.now()) {
      this.errorMessage = 'O retorno deve ser de hoje em diante.';
      return;
    }

    const scheduledAt = this.selectedOrderForManagement.scheduledAt ? new Date(this.selectedOrderForManagement.scheduledAt) : null;
    if (scheduledAt && returnAt.getTime() < scheduledAt.getTime()) {
      this.errorMessage = 'Não é possível marcar retorno antes da data de agendamento do serviço.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.clientOrdersService.scheduleReturn(this.selectedOrderForManagement.id, { returnAt: returnAt.toISOString() }).subscribe({
      next: (updated) => {
        this.replaceOrder(updated);
        this.selectedOrderForManagement = updated;
        this.saving = false;
        this.infoMessage = 'Retorno agendado com sucesso.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível agendar o retorno.';
        this.saving = false;
      }
    });
  }

  finalizeServiceLifecycle(): void {
    if (!this.selectedOrderForManagement || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.clientOrdersService.finalizeService(this.selectedOrderForManagement.id).subscribe({
      next: (updated) => {
        this.replaceOrder(updated);
        this.selectedOrderForManagement = updated;
        this.saving = false;
        this.infoMessage = 'Serviço finalizado com sucesso.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível finalizar o serviço.';
        this.saving = false;
      }
    });
  }

  finalizeOrder(order: ClientServiceOrderItem): void {
    this.selectedOrderForManagement = order;
    this.finalizeServiceLifecycle();
  }

  openOrderPayments(order: ClientServiceOrderItem): void {
    this.hydratePaymentContextFromOrder(order);
    this.paymentModalErrorMessage = null;
    this.paymentModalInfoMessage = null;
    this.paymentModalOpen = true;
    this.loadPaymentInvoices();
  }

  closePaymentModal(): void {
    this.paymentModalOpen = false;
    this.selectedOrderForPayment = null;
    this.paymentInvoices = [];
    this.paymentInvoiceConfirmModalOpen = false;
    this.selectedInvoiceForPaymentConfirm = null;
    this.paymentPlanLoading = false;
    this.paymentPlanSelection = 'PIX';
    this.paymentPlanMethod = 'PIX';
    this.paymentPlanInstallments = 1;
    this.paymentPlanDownPaymentEnabled = false;
    this.paymentPlanDownPaymentAmount = null;
    this.paymentPlanCustomSplitEnabled = false;
    this.paymentPlanDownPaymentMethod = 'PIX';
    this.paymentPlanRemainingPaymentMethod = 'CREDIT_CARD';
    this.paymentModalErrorMessage = null;
    this.paymentModalInfoMessage = null;
  }

  loadPaymentInvoices(): void {
    if (!this.selectedOrderForPayment) {
      return;
    }

    this.paymentPlanLoading = true;
    this.paymentModalErrorMessage = null;
    this.paymentModalInfoMessage = null;
    this.financeService.listServiceOrderIncomes(this.selectedOrderForPayment.id).subscribe({
      next: (invoices) => {
        this.paymentInvoices = invoices;
        this.paymentPlanLoading = false;
      },
      error: (error) => {
        this.paymentPlanLoading = false;
        this.paymentModalErrorMessage = this.extractApiErrorMessage(error, 'Não foi possível carregar as faturas do serviço.');
      }
    });
  }

  createPaymentPlanForOrder(): void {
    if (!this.selectedOrderForPayment || this.saving) {
      return;
    }

    if (!this.paymentPlanEffectiveAllowsInstallments) {
      this.paymentPlanInstallments = 1;
      this.paymentPlanDownPaymentEnabled = false;
      this.paymentPlanDownPaymentAmount = null;
    }

    if (this.paymentPlanCustomSplitEnabled) {
      this.paymentPlanDownPaymentEnabled = true;
    }

    if (this.paymentPlanInstallments < 1 || this.paymentPlanInstallments > 12) {
      this.paymentModalErrorMessage = 'Informe a quantidade de parcelas entre 1 e 12.';
      return;
    }

    if (this.paymentPlanDownPaymentEnabled) {
      const entry = Number(this.paymentPlanDownPaymentAmount || 0);
      const total = Number(this.selectedOrderForPayment.finalTotal || 0);

      if (entry <= 0) {
        this.paymentModalErrorMessage = 'Informe um valor de entrada válido.';
        return;
      }

      if (entry >= total) {
        this.paymentModalErrorMessage = 'A entrada deve ser menor que o valor total do serviço.';
        return;
      }
    }

    this.saving = true;
    this.paymentModalErrorMessage = null;
    this.paymentModalInfoMessage = null;
    this.infoMessage = null;

    this.clientOrdersService
      .createPaymentPlan(this.selectedOrderForPayment.id, {
        paymentMethod: this.paymentPlanMethod,
        installmentCount: this.paymentPlanEffectiveAllowsInstallments ? Number(this.paymentPlanInstallments) : 1,
        downPaymentEnabled: this.paymentPlanEffectiveAllowsInstallments ? this.paymentPlanDownPaymentEnabled : false,
        downPaymentAmount: this.paymentPlanEffectiveAllowsInstallments && this.paymentPlanDownPaymentEnabled ? Number(this.paymentPlanDownPaymentAmount || 0) : null,
        customSplitPaymentEnabled: this.paymentPlanCustomSplitEnabled,
        downPaymentMethod: this.paymentPlanCustomSplitEnabled ? this.paymentPlanDownPaymentMethod : null,
        remainingPaymentMethod: this.paymentPlanCustomSplitEnabled ? this.paymentPlanRemainingPaymentMethod : null
      })
      .subscribe({
        next: (updatedOrder) => {
          this.replaceOrder(updatedOrder);
          this.selectedOrderForPayment = updatedOrder;
          this.saving = false;
          this.infoMessage = 'Faturas geradas com sucesso.';
          this.loadPaymentInvoices();
        },
        error: (error) => {
          this.saving = false;
          this.paymentModalErrorMessage = this.extractApiErrorMessage(error, 'Não foi possível gerar as faturas do serviço.');
        }
      });
  }

  goToFinanceFromPayment(): void {
    const orderId = this.selectedOrderForPayment?.id;
    this.closePaymentModal();

    this.router.navigate(['/finance/incomes'], {
      queryParams: {
        source: orderId ? 'SERVICE_ORDER' : null,
        referenceId: orderId || null
      },
      queryParamsHandling: 'merge'
    });
  }

  openInvoicePaymentConfirm(invoice: FinanceIncomeItem): void {
    if (this.saving || invoice.paymentStatus === 'PAGO') {
      return;
    }

    this.selectedInvoiceForPaymentConfirm = invoice;
    this.paymentInvoiceConfirmModalOpen = true;
    this.paymentModalErrorMessage = null;
    this.paymentModalInfoMessage = null;
  }

  closeInvoicePaymentConfirm(): void {
    this.paymentInvoiceConfirmModalOpen = false;
    this.selectedInvoiceForPaymentConfirm = null;
  }

  confirmSelectedInvoicePayment(): void {
    if (!this.selectedInvoiceForPaymentConfirm) {
      return;
    }

    const invoice = this.selectedInvoiceForPaymentConfirm;
    this.closeInvoicePaymentConfirm();
    this.confirmInvoicePayment(invoice);
  }

  confirmInvoicePayment(invoice: FinanceIncomeItem): void {
    if (this.saving || invoice.paymentStatus === 'PAGO') {
      return;
    }

    this.saving = true;
    this.paymentModalErrorMessage = null;
    this.paymentModalInfoMessage = null;

    this.financeService.confirmIncomePayment(invoice.id).subscribe({
      next: () => {
        this.saving = false;
        this.paymentModalInfoMessage = 'Pagamento da fatura confirmado.';
        this.loadPaymentInvoices();
        this.loadOrders();
      },
      error: (error) => {
        this.saving = false;
        this.paymentModalErrorMessage = this.extractApiErrorMessage(error, 'Não foi possível confirmar o pagamento da fatura.');
      }
    });
  }

  getInvoiceStatusLabel(status: string | null | undefined): string {
    return (status || '').toUpperCase() === 'PAGO' ? 'Pago' : 'Aguardando pagamento';
  }

  getCompactInvoiceDescription(description: string | null | undefined): string {
    const raw = (description || '').trim();
    if (!raw) {
      return '-';
    }

    const [firstPart] = raw.split(/\s+-\s+/);
    const compact = (firstPart || '').trim();
    return compact || raw;
  }

  onPaymentPlanMethodChange(method: PaymentPlanSelection): void {
    this.paymentPlanSelection = method;

    if (method === 'CUSTOM_SPLIT') {
      this.paymentPlanCustomSplitEnabled = true;
      this.paymentPlanDownPaymentEnabled = true;
      this.paymentPlanMethod = this.paymentPlanRemainingPaymentMethod;
      return;
    }

    this.paymentPlanMethod = method;
    this.paymentPlanCustomSplitEnabled = false;

    if (!this.paymentPlanAllowsInstallments) {
      this.paymentPlanInstallments = 1;
      this.paymentPlanDownPaymentEnabled = false;
      this.paymentPlanDownPaymentAmount = null;
      return;
    }

    if (!this.paymentPlanInstallments || this.paymentPlanInstallments < 1 || this.paymentPlanInstallments > 12) {
      this.paymentPlanInstallments = 1;
    }
  }

  onPaymentPlanCustomSplitChange(enabled: boolean): void {
    this.paymentPlanCustomSplitEnabled = enabled;
    if (enabled) {
      this.paymentPlanDownPaymentEnabled = true;
      this.paymentPlanMethod = this.paymentPlanRemainingPaymentMethod;
      this.paymentPlanSelection = 'CUSTOM_SPLIT';
      return;
    }

    this.paymentPlanSelection = this.paymentPlanMethod;

    this.paymentPlanDownPaymentEnabled = false;
    this.paymentPlanDownPaymentAmount = null;
    this.paymentPlanDownPaymentMethod = 'PIX';
    this.paymentPlanRemainingPaymentMethod = 'CREDIT_CARD';
  }

  onRemainingPaymentMethodChange(method: ServicePaymentMethod): void {
    this.paymentPlanRemainingPaymentMethod = method;
    this.paymentPlanMethod = method;
    if (this.paymentPlanCustomSplitEnabled) {
      this.paymentPlanSelection = 'CUSTOM_SPLIT';
    }

    if (!this.paymentPlanEffectiveAllowsInstallments) {
      this.paymentPlanInstallments = 1;
      this.paymentPlanDownPaymentEnabled = false;
      this.paymentPlanDownPaymentAmount = null;
    }
  }

  deleteServiceOrder(order: ClientServiceOrderItem): void {
    if (this.saving) {
      return;
    }

    if (!this.canDeleteServiceOrders()) {
      this.errorMessage = 'Sem permissão para excluir serviço.';
      return;
    }

    this.selectedOrderForDeletion = order;
    this.deleteServiceOrderModalOpen = true;
    this.errorMessage = null;
    this.infoMessage = null;
  }

  closeDeleteServiceOrderModal(): void {
    this.deleteServiceOrderModalOpen = false;
    this.selectedOrderForDeletion = null;
  }

  confirmDeleteServiceOrder(): void {
    if (!this.selectedOrderForDeletion || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.financeService.deleteServiceOrderWithIncomes(this.selectedOrderForDeletion.id).subscribe({
      next: () => {
        this.saving = false;
        const deletedOrderId = this.selectedOrderForDeletion?.id;
        this.closeDeleteServiceOrderModal();
        if (!deletedOrderId) {
          return;
        }
        this.orders = this.orders.filter((item) => item.id !== deletedOrderId);
        if (this.selectedOrderForDetails?.id === deletedOrderId) {
          this.closeOrderDetails();
        }
        if (this.selectedOrderForManagement?.id === deletedOrderId) {
          this.closeServiceManagementModal();
        }
        this.infoMessage = 'Serviço e faturas vinculadas excluídos com sucesso.';
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Não foi possível excluir o serviço.';
      }
    });
  }

  getOrderStatusLabel(status: string | null | undefined): string {
    const normalized = (status || '').trim().toUpperCase();
    if (normalized === 'ORCADO') {
      return 'Aguardando agendamento';
    }
    if (normalized === 'AGENDADO') {
      return 'Agendado';
    }
    if (normalized === 'AGUARDANDO_RETORNO') {
      return 'Aguardando retorno';
    }
    if (normalized === 'FINALIZADO') {
      return 'Finalizado';
    }
    return 'Não informado';
  }

  getPaymentStatusLabel(status: ClientServiceOrderPaymentStatus | string | null | undefined): string {
    const normalized = (status || '').trim().toUpperCase();
    if (normalized === 'ORCADO') {
      return 'Orçado';
    }
    if (normalized === 'AGUARDANDO_PAGAMENTO') {
      return 'Aguardando pagamento';
    }
    if (normalized === 'PAGAMENTO_PARCIAL') {
      return 'Pagamento parcial';
    }
    if (normalized === 'PAGAMENTO_CONCLUIDO') {
      return 'Pagamento concluído';
    }
    return 'Não informado';
  }

  canManageServiceLifecycle(status: string | null | undefined): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'ORCADO' || normalized === 'AGENDADO' || normalized === 'AGUARDANDO_RETORNO';
  }

  canScheduleService(status: string | null | undefined): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'ORCADO';
  }

  canScheduleServiceReturn(status: string | null | undefined): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'AGENDADO' || normalized === 'AGUARDANDO_RETORNO';
  }

  canFinalizeServiceLifecycle(status: string | null | undefined): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'AGENDADO' || normalized === 'AGUARDANDO_RETORNO';
  }

  isStatusQuoted(status: string): boolean {
    return status === 'ORCADO';
  }

  isStatusAwaiting(status: string): boolean {
    return status === 'AGENDADO';
  }

  isStatusPaid(status: string): boolean {
    return status === 'AGUARDANDO_RETORNO' || status === 'FINALIZADO';
  }

  private syncPaymentFlags(): void {
    if (!this.requiresInstallments) {
      this.paymentPaid = false;
      this.paymentFirstInstallmentPaid = false;
      return;
    }

    if (this.paymentInstallmentCount > 1) {
      this.paymentPaid = false;
    }

    if (this.paymentInstallmentCount <= 1 || this.paymentPaid) {
      this.paymentFirstInstallmentPaid = false;
    }
  }

  private resetCreateWizard(): void {
    this.createWizardStep = 1;
    this.createWizardLoading = false;
    this.selectedClientId = '';
    this.serviceOrderId = null;
    this.selectedServiceIds = [''];
    this.extraProductRows = [];
    this.wizardNotes = '';
    this.wizardDiscountAmount = 0;
    this.wizardCustomTotalEnabled = false;
    this.wizardCustomTotalValue = null;
    this.paymentMethod = 'PIX';
    this.paymentInstallmentCount = 1;
    this.paymentPaid = false;
    this.paymentFirstInstallmentPaid = false;
    this.wizardServiceStatus = null;
  }

  private replaceOrder(updated: ClientServiceOrderItem): void {
    this.orders = this.orders.map((item) => (item.id === updated.id ? updated : item));
    if (this.selectedOrderForDetails?.id === updated.id) {
      this.selectedOrderForDetails = updated;
    }
    if (this.selectedOrderForPayment?.id === updated.id) {
      this.selectedOrderForPayment = updated;
    }
  }

  private hydratePaymentContextFromOrder(order: ClientServiceOrderItem): void {
    this.selectedOrderForPayment = order;
    this.paymentPlanSelection = order.paymentMethod || 'PIX';
    this.paymentPlanMethod = order.paymentMethod || 'PIX';
    this.paymentPlanInstallments = order.installmentCount && order.installmentCount > 0 ? order.installmentCount : 1;
    this.paymentPlanDownPaymentEnabled = false;
    this.paymentPlanDownPaymentAmount = null;
    this.paymentPlanCustomSplitEnabled = false;
    this.paymentPlanDownPaymentMethod = 'PIX';
    this.paymentPlanRemainingPaymentMethod = 'CREDIT_CARD';
  }

  private addDaysFromNow(days: number): Date {
    const result = new Date();
    result.setDate(result.getDate() + days);
    return result;
  }

  private addDays(base: Date, days: number): Date {
    const result = new Date(base);
    result.setDate(result.getDate() + days);
    return result;
  }

  private resolveReturnBaseDate(order: ClientServiceOrderItem): Date {
    if (order.nextReturnAt) {
      const nextReturn = new Date(order.nextReturnAt);
      if (!Number.isNaN(nextReturn.getTime())) {
        return nextReturn;
      }
    }

    if (order.scheduledAt) {
      const scheduledAt = new Date(order.scheduledAt);
      if (!Number.isNaN(scheduledAt.getTime())) {
        return this.addDays(scheduledAt, 7);
      }
    }

    return this.addDaysFromNow(7);
  }

  private hasPendingReturn(order: ClientServiceOrderItem): boolean {
    if (!order.nextReturnAt) {
      return false;
    }

    const nextReturn = new Date(order.nextReturnAt);
    if (Number.isNaN(nextReturn.getTime())) {
      return false;
    }

    return nextReturn.getTime() > Date.now();
  }

  private formatDateTime(value: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(value);
  }

  private toDateTimeLocalInput(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private extractApiErrorMessage(error: any, fallback: string): string {
    const message = error?.error?.message || error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    return fallback;
  }
}
