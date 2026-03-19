import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ClientOrdersService } from 'src/app/core/client-orders/client-orders.service';
import {
  ClientServiceOrderItem,
  ClientServiceOrderStatus,
  ConfirmClientServiceOrderPaymentRequest,
  CreateClientServiceOrderRequest,
  ServicePaymentMethod
} from 'src/app/core/client-orders/client-orders.types';
import { ClientsService } from 'src/app/core/clients/clients.service';
import { ClientListItem } from 'src/app/core/clients/clients.types';
import { ProductItem } from 'src/app/core/products/products.types';
import { ProductsService } from 'src/app/core/products/products.service';
import { ServiceItem } from 'src/app/core/services/services.types';
import { ServicesService } from 'src/app/core/services/services.service';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

interface ExtraProductRow {
  productId: string;
  quantityUsed: number;
}

@Component({
  selector: 'app-client-services',
  imports: [CommonModule, FormsModule, CardComponent],
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

  detailsModalOpen = false;
  selectedOrderForDetails: ClientServiceOrderItem | null = null;

  serviceManagementModalOpen = false;
  selectedOrderForManagement: ClientServiceOrderItem | null = null;
  serviceManagementObservation = '';
  serviceManagementReturnAt = '';

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

  get filteredOrders(): ClientServiceOrderItem[] {
    const normalizedSearch = (this.searchTerm || '').trim().toLowerCase();

    return this.orders.filter((order) => {
      const matchesStatus = !this.selectedStatus || order.status === this.selectedStatus;
      const matchesSearch =
        !normalizedSearch ||
        (order.clientName || '').toLowerCase().includes(normalizedSearch) ||
        (order.notes || '').toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }

  loadInitialData(): void {
    this.loading = true;
    this.errorMessage = null;

    this.clientsService.list().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.servicesService.list().subscribe({
          next: (services) => {
            this.availableServices = services.filter((item) => item.active);
            this.productsService.list().subscribe({
              next: (products) => {
                this.availableProducts = products.filter((item) => item.active);
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
        this.errorMessage = 'Não foi possível carregar os serviços dos clientes.';
        this.loading = false;
      }
    });
  }

  openCreateWizard(): void {
    this.resetCreateWizard();
    this.createWizardOpen = true;
  }

  closeCreateWizard(): void {
    this.createWizardOpen = false;
    this.createWizardLoading = false;
    this.serviceOrderId = null;
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

  onServiceSelectionChange(index: number, serviceId: string): void {
    this.selectedServiceIds[index] = serviceId || '';
  }

  isServiceOptionDisabled(serviceId: string, currentIndex: number): boolean {
    return this.selectedServiceIds.some((selectedId, index) => index !== currentIndex && selectedId === serviceId);
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
        this.saving = false;
        this.errorMessage = null;
        this.infoMessage = moveToPaymentStep ? 'Orçamento salvo. Agora finalize o pagamento.' : 'Orçamento salvo com sucesso.';
        if (moveToPaymentStep) {
          this.createWizardStep = 4;
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
    this.serviceManagementReturnAt = this.toDateTimeLocalInput(this.addDaysFromNow(7));
    this.errorMessage = null;
    this.infoMessage = null;
  }

  closeServiceManagementModal(): void {
    this.serviceManagementModalOpen = false;
    this.selectedOrderForManagement = null;
    this.serviceManagementObservation = '';
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

    if (!this.serviceManagementReturnAt) {
      this.errorMessage = 'Informe data e hora do retorno.';
      return;
    }

    const returnAt = new Date(this.serviceManagementReturnAt);
    if (Number.isNaN(returnAt.getTime())) {
      this.errorMessage = 'Data/hora de retorno inválida.';
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

  openOrderPayments(order: ClientServiceOrderItem): void {
    this.router.navigate(['/finance/incomes'], {
      queryParams: {
        source: 'SERVICE_ORDER',
        referenceId: order.id
      }
    });
  }

  getOrderStatusLabel(status: string | null | undefined): string {
    const normalized = (status || '').trim().toUpperCase();
    if (normalized === 'ORCADO') {
      return 'Orçado';
    }
    if (normalized === 'AGUARDANDO_PAGAMENTO') {
      return 'Aguardando pagamento';
    }
    if (normalized === 'PAGO') {
      return 'Pago/em atendimento';
    }
    if (normalized === 'RETORNO_AGENDADO') {
      return 'Retorno agendado';
    }
    if (normalized === 'FINALIZADO') {
      return 'Finalizado';
    }
    return 'Não informado';
  }

  canManageServiceLifecycle(status: string | null | undefined): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'PAGO' || normalized === 'RETORNO_AGENDADO' || normalized === 'FINALIZADO';
  }

  canScheduleServiceReturn(status: string | null | undefined): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'PAGO' || normalized === 'RETORNO_AGENDADO';
  }

  canFinalizeServiceLifecycle(status: string | null | undefined): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'PAGO' || normalized === 'RETORNO_AGENDADO';
  }

  isStatusQuoted(status: string): boolean {
    return status === 'ORCADO';
  }

  isStatusAwaiting(status: string): boolean {
    return status === 'AGUARDANDO_PAGAMENTO';
  }

  isStatusPaid(status: string): boolean {
    return status === 'PAGO' || status === 'RETORNO_AGENDADO' || status === 'FINALIZADO';
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
  }

  private replaceOrder(updated: ClientServiceOrderItem): void {
    this.orders = this.orders.map((item) => (item.id === updated.id ? updated : item));
  }

  private addDaysFromNow(days: number): Date {
    const result = new Date();
    result.setDate(result.getDate() + days);
    return result;
  }

  private toDateTimeLocalInput(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
