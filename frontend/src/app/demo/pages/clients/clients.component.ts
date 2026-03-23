import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { AnamnesisService } from 'src/app/core/anamnesis/anamnesis.service';
import { PublicAnamnesisForm } from 'src/app/core/anamnesis/anamnesis.types';
import { AuthService } from 'src/app/core/auth/auth.service';

import { ClientOrdersService } from 'src/app/core/client-orders/client-orders.service';
import {
  ClientServiceOrderItem,
  ConfirmClientServiceOrderPaymentRequest,
  CreateClientServiceOrderRequest,
  ServicePaymentMethod
} from 'src/app/core/client-orders/client-orders.types';
import { ClientsService } from 'src/app/core/clients/clients.service';
import { CLIENT_ORIGIN_OPTIONS, ClientListItem, CreateClientRequest } from 'src/app/core/clients/clients.types';
import { FinanceService } from 'src/app/core/finance/finance.service';
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
  selector: 'app-clients',
  imports: [CommonModule, FormsModule, NgSelectModule, CardComponent],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  loading = false;
  saving = false;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  clients: ClientListItem[] = [];
  detailClient: ClientListItem | null = null;

  modalOpen = false;
  detailsModalOpen = false;
  originLocked = false;
  anamnesisModalOpen = false;
  anamnesisModalLoading = false;
  selectedClientForAnamnesis: ClientListItem | null = null;
  anamnesisFormData: PublicAnamnesisForm | null = null;
  anamnesisModalError: string | null = null;
  anamnesisModalInfo: string | null = null;
  anamnesisShareLink: string | null = null;

  serviceWizardOpen = false;
  serviceWizardStep = 1;
  serviceWizardLoading = false;
  deleteClientModalOpen = false;
  deleteOrderInvoicesModalOpen = false;
  selectedClientForService: ClientListItem | null = null;
  selectedClientForDeletion: ClientListItem | null = null;
  selectedOrderForInvoiceDeletion: ClientServiceOrderItem | null = null;
  selectedOrderForManagement: ClientServiceOrderItem | null = null;
  serviceOrderId: string | null = null;
  availableServices: ServiceItem[] = [];
  availableProducts: ProductItem[] = [];
  selectedServiceIds: string[] = [];
  extraProductRows: ExtraProductRow[] = [];
  clientServiceHistory: ClientServiceOrderItem[] = [];
  serviceHistoryAccordionOpen = false;
  wizardNotes = '';
  wizardDiscountAmount = 0;
  wizardCustomTotalEnabled = false;
  wizardCustomTotalValue: number | null = null;
  paymentMethod: ServicePaymentMethod = 'PIX';
  paymentInstallmentCount = 1;
  paymentPaid = false;
  paymentFirstInstallmentPaid = false;
  serviceManagementModalOpen = false;
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

  readonly originOptions = CLIENT_ORIGIN_OPTIONS;

  form: CreateClientRequest = this.createDefaultForm();

  constructor(
    private readonly clientsService: ClientsService,
    private readonly servicesService: ServicesService,
    private readonly productsService: ProductsService,
    private readonly clientOrdersService: ClientOrdersService,
    private readonly anamnesisService: AnamnesisService,
    private readonly financeService: FinanceService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.errorMessage = null;

    this.clientsService.list().subscribe({
      next: (response) => {
        this.clients = response;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os clientes.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.errorMessage = null;
    this.infoMessage = null;
    this.originLocked = false;
    this.form = this.createDefaultForm();
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  openDetailsModal(client: ClientListItem): void {
    this.detailClient = client;
    this.detailsModalOpen = true;
  }

  openAnamnesis(client: ClientListItem): void {
    this.selectedClientForAnamnesis = client;
    this.anamnesisFormData = null;
    this.anamnesisModalError = null;
    this.anamnesisModalInfo = null;
    this.anamnesisShareLink = null;
    this.anamnesisModalOpen = true;
    this.anamnesisModalLoading = true;

    this.anamnesisService.getPublicForm(client.id, null).subscribe({
      next: (response) => {
        this.anamnesisFormData = response;
        this.anamnesisModalLoading = false;
      },
      error: (error) => {
        this.anamnesisModalError = error?.error?.message || 'Não foi possível carregar a anamnese deste cliente.';
        this.anamnesisModalLoading = false;
      }
    });
  }

  closeAnamnesisModal(): void {
    this.anamnesisModalOpen = false;
    this.anamnesisModalLoading = false;
    this.selectedClientForAnamnesis = null;
    this.anamnesisFormData = null;
    this.anamnesisModalError = null;
    this.anamnesisModalInfo = null;
    this.anamnesisShareLink = null;
  }

  async generateAnamnesisLink(): Promise<void> {
    const clientId = this.anamnesisFormData?.clientId || this.selectedClientForAnamnesis?.id;
    if (!clientId) {
      this.anamnesisModalError = 'Cliente inválido para gerar link de anamnese.';
      return;
    }

    const link = this.buildAnamnesisLink(clientId);
    this.anamnesisShareLink = link;
    this.anamnesisModalError = null;

    const copied = await this.copyToClipboard(link);
    this.anamnesisModalInfo = copied ? 'Link da anamnese gerado e copiado.' : 'Link da anamnese gerado.';
  }

  private buildAnamnesisLink(clientId: string): string {
    const query = `clientId=${encodeURIComponent(clientId)}`;
    const path = `/anamnese?${query}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return origin ? `${origin}${path}` : path;
  }

  private async copyToClipboard(value: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        return this.copyWithTextarea(value);
      }
    }

    return this.copyWithTextarea(value);
  }

  private copyWithTextarea(value: string): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }

    document.body.removeChild(textarea);
    return copied;
  }

  closeDetailsModal(): void {
    this.detailsModalOpen = false;
    this.detailClient = null;
  }

  createClient(): void {
    if (this.saving) {
      return;
    }

    const payload: CreateClientRequest = {
      fullName: (this.form.fullName || '').trim(),
      phone: (this.form.phone || '').trim(),
      cpf: (this.form.cpf || '').trim() || null,
      email: (this.form.email || '').trim().toLowerCase() || null,
      origin: this.form.origin,
      sourceContactId: this.form.sourceContactId || null,
      notes: (this.form.notes || '').trim() || null
    };

    if (!payload.fullName || !payload.phone) {
      this.errorMessage = 'Preencha nome e número do cliente.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.clientsService.create(payload).subscribe({
      next: () => {
        this.infoMessage = 'Cliente cadastrado com sucesso.';
        this.saving = false;
        this.closeModal();
        this.loadClients();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível cadastrar o cliente.';
        this.saving = false;
      }
    });
  }

  getOriginLabel(origin: string | null | undefined): string {
    const value = (origin || '').trim().toUpperCase();
    const found = this.originOptions.find((option) => option.value === value);
    return found?.label || origin || 'Não informado';
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

  getInitials(name: string | null | undefined): string {
    const source = (name || '').trim();
    if (!source) {
      return '--';
    }

    const parts = source.split(/\s+/).filter(Boolean);
    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) || '' : '';
    return `${first}${last}`.toUpperCase() || source.slice(0, 2).toUpperCase();
  }

  openServiceWizard(client: ClientListItem): void {
    this.router.navigate(['/clients', client.id]);
  }

  closeServiceWizard(): void {
    this.serviceWizardOpen = false;
    this.selectedClientForService = null;
    this.serviceOrderId = null;
    this.serviceHistoryAccordionOpen = false;
  }

  toggleServiceHistoryAccordion(): void {
    this.serviceHistoryAccordionOpen = !this.serviceHistoryAccordionOpen;
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

  getPaymentMethodLabel(method: string | null | undefined): string {
    const normalized = (method || '').trim().toUpperCase();
    if (normalized === 'PIX') {
      return 'Pix';
    }
    if (normalized === 'CREDIT_CARD') {
      return 'Cartão de crédito';
    }
    if (normalized === 'PIX_INSTALLMENT') {
      return 'Pix parcelado';
    }
    if (normalized === 'CASH') {
      return 'Dinheiro';
    }
    if (normalized === 'TRADE') {
      return 'Troca';
    }
    return 'Não informado';
  }

  getInstallmentLabel(installmentCount: number | null | undefined): string {
    const count = Number(installmentCount || 1);
    if (count <= 1) {
      return 'À vista';
    }
    return `${count}x`;
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

  isOrderStatusQuoted(status: string | null | undefined): boolean {
    return (status || '').trim().toUpperCase() === 'ORCADO';
  }

  isOrderStatusAwaiting(status: string | null | undefined): boolean {
    return (status || '').trim().toUpperCase() === 'AGUARDANDO_PAGAMENTO';
  }

  isOrderStatusPaid(status: string | null | undefined): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'PAGO' || normalized === 'RETORNO_AGENDADO' || normalized === 'FINALIZADO';
  }

  canFinalizeHistoryOrder(status: string | null | undefined): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'ORCADO';
  }

  canViewOrderPayments(status: string | null | undefined): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'AGUARDANDO_PAGAMENTO' || normalized === 'PAGO' || normalized === 'RETORNO_AGENDADO' || normalized === 'FINALIZADO';
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

  canDeleteOrderInvoices(): boolean {
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

  canDeleteClient(): boolean {
    return this.canDeleteOrderInvoices();
  }

  deleteClient(client: ClientListItem): void {
    if (this.saving) {
      return;
    }

    if (!this.canDeleteClient()) {
      this.errorMessage = 'Sem permissão para excluir cliente.';
      return;
    }

    this.selectedClientForDeletion = client;
    this.deleteClientModalOpen = true;
    this.errorMessage = null;
    this.infoMessage = null;
  }

  closeDeleteClientModal(): void {
    this.deleteClientModalOpen = false;
    this.selectedClientForDeletion = null;
  }

  confirmDeleteClient(): void {
    if (!this.selectedClientForDeletion || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.clientsService.delete(this.selectedClientForDeletion.id).subscribe({
      next: () => {
        this.saving = false;
        this.closeDeleteClientModal();
        this.infoMessage = 'Cliente excluído com sucesso.';
        this.loadClients();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Não foi possível excluir o cliente.';
      }
    });
  }

  finalizeHistoryOrder(order: ClientServiceOrderItem): void {
    this.applyOrderForPayment(order);
    this.serviceWizardStep = 4;
    this.infoMessage = 'Orçamento carregado. Finalize o pagamento no passo 4.';
    this.errorMessage = null;
  }

  openOrderPayments(order: ClientServiceOrderItem): void {
    this.closeServiceWizard();
    this.router.navigate(['/finance/incomes'], {
      queryParams: {
        source: 'SERVICE_ORDER',
        referenceId: order.id
      }
    });
  }

  openServiceManagement(order: ClientServiceOrderItem): void {
    this.selectedOrderForManagement = order;
    this.serviceManagementModalOpen = true;
    this.serviceManagementObservation = '';
    this.serviceManagementReturnAt = this.toDateTimeLocalInput(this.addDays(new Date(), 7));
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
        this.replaceHistoryOrder(updated);
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
        this.replaceHistoryOrder(updated);
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
        this.replaceHistoryOrder(updated);
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

  private replaceHistoryOrder(updated: ClientServiceOrderItem): void {
    this.clientServiceHistory = this.clientServiceHistory.map((item) => (item.id === updated.id ? updated : item));
  }

  openDeleteOrderInvoicesModal(order: ClientServiceOrderItem): void {
    if (!this.canDeleteOrderInvoices()) {
      this.errorMessage = 'Sem permissão para excluir o orçamento e suas faturas.';
      return;
    }

    this.selectedOrderForInvoiceDeletion = order;
    this.deleteOrderInvoicesModalOpen = true;
    this.errorMessage = null;
    this.infoMessage = null;
  }

  closeDeleteOrderInvoicesModal(): void {
    this.deleteOrderInvoicesModalOpen = false;
    this.selectedOrderForInvoiceDeletion = null;
  }

  confirmDeleteOrderInvoices(): void {
    if (!this.selectedOrderForInvoiceDeletion || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.financeService.deleteServiceOrderWithIncomes(this.selectedOrderForInvoiceDeletion.id).subscribe({
      next: () => {
        this.saving = false;
        this.closeDeleteOrderInvoicesModal();
        this.serviceOrderId = null;
        this.infoMessage = 'Orçamento e faturas excluídos com sucesso.';
        this.refreshOrderHistory();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Não foi possível excluir o orçamento e suas faturas.';
      }
    });
  }

  goToWizardStep(step: number): void {
    if (step === 4) {
      this.saveBudget(true);
      return;
    }

    if (step === 2 && this.selectedServices.length === 0) {
      this.errorMessage = 'Selecione ao menos um serviço para continuar.';
      return;
    }

    if (step === 3) {
      if (this.selectedServices.length === 0) {
        this.errorMessage = 'Selecione ao menos um serviço para continuar.';
        return;
      }

      if (!this.hasSufficientStock) {
        this.errorMessage = 'Estoque insuficiente para fechar este orçamento.';
        return;
      }
    }

    this.errorMessage = null;
    this.serviceWizardStep = step;
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

  addExtraProductRow(): void {
    this.extraProductRows.push({
      productId: '',
      quantityUsed: 1
    });
  }

  removeExtraProductRow(index: number): void {
    this.extraProductRows.splice(index, 1);
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

  saveBudget(moveToPaymentStep = false): void {
    if (!this.selectedClientForService) {
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
      clientId: this.selectedClientForService.id,
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
          this.serviceWizardStep = 4;
        }
        this.refreshOrderHistory();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível salvar o orçamento deste cliente.';
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
        this.closeServiceWizard();
        this.loadClients();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível confirmar o pagamento.';
        this.saving = false;
      }
    });
  }

  private applyOrderForPayment(order: ClientServiceOrderItem): void {
    this.serviceOrderId = order.id;
    this.selectedServiceIds = order.services.map((item) => item.serviceId);
    if (this.selectedServiceIds.length === 0) {
      this.selectedServiceIds = [''];
    }

    this.extraProductRows = order.products
      .filter((item) => item.source === 'EXTRA')
      .map((item) => ({
        productId: item.productId,
        quantityUsed: Number(item.quantityUsed || 0)
      }));

    this.wizardDiscountAmount = Number(order.discountAmount || 0);
    this.wizardCustomTotalEnabled = !!order.customTotalEnabled;
    this.wizardCustomTotalValue = order.customTotalEnabled ? Number(order.customTotalValue || 0) : null;
    this.wizardNotes = order.notes || '';
    this.paymentMethod = (order.paymentMethod as ServicePaymentMethod) || 'PIX';
    this.paymentInstallmentCount = Number(order.installmentCount || 1);
    if (this.paymentInstallmentCount < 1 || this.paymentInstallmentCount > 12) {
      this.paymentInstallmentCount = 1;
    }
    this.paymentPaid = order.status === 'PAGO' || order.status === 'RETORNO_AGENDADO' || order.status === 'FINALIZADO';
    this.paymentFirstInstallmentPaid = !this.paymentPaid && this.paymentInstallmentCount > 1 && Number(order.paidInstallmentCount || 0) > 0;

    if (!this.requiresInstallments) {
      this.paymentInstallmentCount = 1;
      this.paymentPaid = false;
      this.paymentFirstInstallmentPaid = false;
    }

    this.syncPaymentFlags();
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

  private refreshOrderHistory(): void {
    if (!this.selectedClientForService) {
      return;
    }

    this.clientOrdersService.listByClient(this.selectedClientForService.id).subscribe({
      next: (history) => {
        this.clientServiceHistory = history;
      }
    });
  }

  private createDefaultForm(): CreateClientRequest {
    return {
      fullName: '',
      phone: '',
      cpf: '',
      email: '',
      origin: 'CADASTRO_MANUAL',
      sourceContactId: null,
      notes: ''
    };
  }

  private addDays(value: Date, days: number): Date {
    const result = new Date(value);
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
