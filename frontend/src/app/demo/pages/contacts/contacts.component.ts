import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';
import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

import { AuthService } from 'src/app/core/auth/auth.service';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { ClientsService } from 'src/app/core/clients/clients.service';
import { CLIENT_ORIGIN_OPTIONS, CreateClientRequest } from 'src/app/core/clients/clients.types';
import { ContactsService } from 'src/app/core/contacts/contacts.service';
import { ContactMessage, ContactView } from 'src/app/core/contacts/contacts.types';
import { WhatsappService } from 'src/app/core/whatsapp/whatsapp.service';



@Component({
  selector: 'app-contacts',
  imports: [CommonModule, FormsModule, NgSelectModule, CardComponent],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {
  viewMode: 'geral' | 'nao-lidas' | 'em-andamento' = 'geral';

  contacts: ContactView[] = [];
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  selectedStageDraft = 'ALL';
  selectedStage = 'ALL';
  selectedInProgressStageDraft = 'ALL';
  selectedInProgressStage = 'ALL';
  selectedUnreadPeriodDraft = 'ALL';
  selectedUnreadPeriod = 'ALL';
  searchQueryDraft = '';
  searchQuery = '';
  readonly stageOptions: Array<{ value: string; label: string }> = [
    { value: 'ALL', label: 'Todos' },
    { value: 'LEAD', label: 'Lead' },
    { value: 'RESCUING', label: 'Resgatando' },
    { value: 'RECENTLY_RESCUED', label: 'Resgatado recentemente' },
    { value: 'QUALIFIED', label: 'Qualificado' },
    { value: 'PROPOSAL', label: 'Proposta' },
    { value: 'CLIENT', label: 'Cliente' },
    { value: 'LOST', label: 'Perdido' }
  ];
  readonly unreadPeriodOptions: Array<{ value: string; label: string }> = [
    { value: 'ALL', label: 'Todos os períodos' },
    { value: 'OLDER_THAN_WEEK', label: 'Não lidos há mais de 1 semana' },
    { value: 'UP_TO_WEEK', label: 'Não lidos há até 1 semana' },
    { value: 'OLDER_THAN_MONTH', label: 'Não lidos há mais de 1 mês' },
    { value: 'UP_TO_MONTH', label: 'Não lidos há até 1 mês' }
  ];
  readonly inProgressStageOptions: Array<{ value: string; label: string }> = [
    { value: 'ALL', label: 'Todos' },
    { value: 'RESCUING', label: 'Resgatando' },
    { value: 'RECENTLY_RESCUED', label: 'Resgatado recentemente' }
  ];

  loading = false;
  syncing = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;
  canManualSync = false;
  whatsappConnected = false;
  whatsappStatusChecked = false;
  resetting = false;
  confirmResetOpen = false;

  clientModalOpen = false;
  clientSaving = false;
  convertingContact: ContactView | null = null;
  readonly clientOriginOptions = CLIENT_ORIGIN_OPTIONS;
  clientForm: CreateClientRequest = this.createDefaultClientForm();

  messagesModalOpen = false;
  modalLoading = false;
  modalError: string | null = null;
  selectedContact: ContactView | null = null;
  selectedMessages: ContactMessage[] = [];
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly contactsService: ContactsService,
    private readonly clientsService: ClientsService,
    private readonly authService: AuthService,
    private readonly whatsappService: WhatsappService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.resolveManualSyncPermission();
    this.resolveViewModeFromRoute();
    this.refreshWhatsappConnectionStatus();

    this.activatedRoute.url.subscribe(() => {
      this.resolveViewModeFromRoute();
      this.currentPage = 0;
      this.errorMessage = null;
      this.infoMessage = null;
      this.loadContacts();
    });

    this.loadContacts();
  }

  get canShowManualActions(): boolean {
    return this.canManualSync && this.whatsappConnected;
  }

  private refreshWhatsappConnectionStatus(): void {
    this.whatsappService.getSessionStatus().subscribe({
      next: (session) => {
        this.whatsappConnected = !!session?.connected;
        this.whatsappStatusChecked = true;
      },
      error: () => {
        this.whatsappConnected = false;
        this.whatsappStatusChecked = true;
      }
    });
  }

  private loadContacts(): void {
    this.loading = true;
    const stageFilter = this.resolveStageFilter();
    const unreadPeriodFilter = this.viewMode === 'nao-lidas' ? this.selectedUnreadPeriod : undefined;

    this.contactsService.listPaged(this.currentPage, this.pageSize, this.viewMode, stageFilter, unreadPeriodFilter, this.searchQuery).subscribe({
      next: (response) => {
        this.contacts = response.content;
        this.currentPage = response.page;
        this.pageSize = response.size;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: () => {
        this.contacts = [];
        this.totalPages = 0;
        this.totalElements = 0;
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (this.loading || this.syncing) {
      return;
    }

    if (page < 0 || page >= this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadContacts();
  }

  get visiblePages(): number[] {
    if (this.totalPages <= 0) {
      return [];
    }

    const maxButtons = 5;
    const start = Math.max(0, this.currentPage - Math.floor(maxButtons / 2));
    const end = Math.min(this.totalPages - 1, start + maxButtons - 1);
    const adjustedStart = Math.max(0, end - maxButtons + 1);

    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
  }

  get pageStartItem(): number {
    if (this.totalElements === 0) {
      return 0;
    }
    return this.currentPage * this.pageSize + 1;
  }

  get pageEndItem(): number {
    if (this.totalElements === 0) {
      return 0;
    }
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  syncAll(): void {
    if (!this.canShowManualActions) {
      this.errorMessage = 'Conecte um WhatsApp para sincronizar todos os contatos.';
      return;
    }

    this.syncing = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.contactsService.syncAll().subscribe({
      next: (result) => {
        this.infoMessage = `Sincronização concluída: ${result.conversationsSynced} conversa(s) e ${result.messagesProcessed} mensagem(ns) processada(s).`;
        this.syncing = false;
        this.currentPage = 0;
        this.loadContacts();
      },
      error: () => {
        this.errorMessage = 'Não foi possível sincronizar todos os contatos agora.';
        this.syncing = false;
      }
    });
  }

  openResetConfirm(): void {
    if (!this.canShowManualActions || this.loading || this.syncing || this.resetting) {
      return;
    }

    this.confirmResetOpen = true;
  }

  closeResetConfirm(): void {
    this.confirmResetOpen = false;
  }

  confirmResetAll(): void {
    if (!this.canShowManualActions || this.resetting) {
      return;
    }

    this.confirmResetOpen = false;
    this.resetting = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.contactsService.resetAll().subscribe({
      next: (result) => {
        this.infoMessage = `Limpeza concluída: ${result.contactsDeleted} contato(s), ${result.conversationsDeleted} conversa(s) e ${result.messagesDeleted} mensagem(ns) removida(s).`;
        this.resetting = false;
        this.currentPage = 0;
        this.contacts = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loadContacts();
      },
      error: () => {
        this.errorMessage = 'Não foi possível limpar os contatos agora.';
        this.resetting = false;
      }
    });
  }

  openCreateClientFromContact(contact: ContactView): void {
    if (!contact) {
      return;
    }

    this.convertingContact = contact;
    this.clientForm = {
      fullName: (contact.fullName || '').trim(),
      phone: (contact.phone || '').trim(),
      cpf: '',
      email: '',
      origin: 'RESGATE',
      sourceContactId: contact.id,
      notes: ''
    };
    this.clientModalOpen = true;
    this.errorMessage = null;
    this.infoMessage = null;
  }

  closeClientModal(): void {
    if (this.clientSaving) {
      return;
    }

    this.clientModalOpen = false;
    this.convertingContact = null;
    this.clientForm = this.createDefaultClientForm();
  }

  createClientFromContact(): void {
    if (this.clientSaving) {
      return;
    }

    const payload: CreateClientRequest = {
      fullName: (this.clientForm.fullName || '').trim(),
      phone: (this.clientForm.phone || '').trim(),
      cpf: (this.clientForm.cpf || '').trim() || null,
      email: (this.clientForm.email || '').trim().toLowerCase() || null,
      origin: 'RESGATE',
      sourceContactId: this.clientForm.sourceContactId || this.convertingContact?.id || null,
      notes: (this.clientForm.notes || '').trim() || null
    };

    if (!payload.fullName || !payload.phone) {
      this.errorMessage = 'Preencha nome e número para tornar este contato um cliente.';
      return;
    }

    this.clientSaving = true;
    this.errorMessage = null;
    this.infoMessage = null;

    this.clientsService.create(payload).subscribe({
      next: () => {
        this.clientSaving = false;
        this.closeClientModal();
        this.infoMessage = 'Cliente criado com sucesso a partir do contato em andamento.';
        this.loadContacts();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível tornar este contato um cliente.';
        this.clientSaving = false;
      }
    });
  }

  openMessages(contact: ContactView): void {
    this.selectedContact = contact;
    this.selectedMessages = [];
    this.modalError = null;
    this.modalLoading = true;
    this.messagesModalOpen = true;

    this.contactsService.getMessages(contact.id, 5).subscribe({
      next: (messages) => {
        this.selectedMessages = messages;
        this.modalLoading = false;
      },
      error: () => {
        this.modalError = 'Não foi possível carregar as mensagens deste contato.';
        this.modalLoading = false;
      }
    });
  }

  closeMessagesModal(): void {
    this.messagesModalOpen = false;
    this.selectedContact = null;
    this.selectedMessages = [];
    this.modalError = null;
  }

  openWhatsapp(contact: ContactView | null): void {
    if (!contact?.phone) {
      return;
    }

    const digits = this.getWhatsappDigits(contact.phone);
    if (!digits) {
      return;
    }

    this.contactsService.markAsRescuing(contact.id).subscribe({
      next: () => {
        window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer');
        this.currentPage = 0;
        this.loadContacts();
      },
      error: () => {
        window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer');
      }
    });
  }

  onStageChange(stage: string): void {
    this.selectedStage = stage;
    this.currentPage = 0;
    this.loadContacts();
  }

  onSearchQueryInput(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.searchQuery = (this.searchQueryDraft || '').trim();
      this.currentPage = 0;
      this.loadContacts();
    }, 350);
  }

  onStageFilterChange(): void {
    this.selectedStage = this.selectedStageDraft || 'ALL';
    this.currentPage = 0;
    this.loadContacts();
  }

  onInProgressStageFilterChange(): void {
    this.selectedInProgressStage = this.selectedInProgressStageDraft || 'ALL';
    this.currentPage = 0;
    this.loadContacts();
  }

  onUnreadPeriodFilterChange(): void {
    this.selectedUnreadPeriod = this.selectedUnreadPeriodDraft || 'ALL';
    this.currentPage = 0;
    this.loadContacts();
  }

  clearFilters(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    this.searchQueryDraft = '';
    this.searchQuery = '';
    this.selectedStageDraft = 'ALL';
    this.selectedStage = 'ALL';
    this.selectedInProgressStageDraft = 'ALL';
    this.selectedInProgressStage = 'ALL';
    this.selectedUnreadPeriodDraft = 'ALL';
    this.selectedUnreadPeriod = 'ALL';
    this.currentPage = 0;
    this.loadContacts();
  }

  getStageLabel(stage: string | null | undefined): string {
    const value = (stage || '').trim().toUpperCase();

    const fromOptions = this.stageOptions.find((item) => item.value === value);
    if (fromOptions) {
      return fromOptions.label;
    }

    return stage || 'Não informado';
  }

  getUnreadPeriodLabel(period: string | null | undefined): string {
    const value = (period || '').trim().toUpperCase();
    const found = this.unreadPeriodOptions.find((item) => item.value === value);
    return found?.label || 'Todos os períodos';
  }

  get viewTitle(): string {
    if (this.viewMode === 'nao-lidas') {
      return 'Não Lidas';
    }

    if (this.viewMode === 'em-andamento') {
      return 'Em Andamento';
    }

    return 'Geral';
  }

  private resolveViewModeFromRoute(): void {
    const currentUrl = this.router.url.toLowerCase();

    if (currentUrl.includes('/contacts/nao-lidas')) {
      this.viewMode = 'nao-lidas';
      return;
    }

    if (currentUrl.includes('/contacts/em-andamento')) {
      this.viewMode = 'em-andamento';
      return;
    }

    this.viewMode = 'geral';
  }

  private resolveManualSyncPermission(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.canManualSync = false;
      return;
    }

    const email = (user.email || '').trim().toLowerCase();
    const roles = (user.roles || []).map((role) => (role || '').trim().toUpperCase());

    this.canManualSync = email === 'carol@gmail.com' || roles.includes('DEV_SUPORTE') || roles.includes('MASTER_ADMIN');
  }

  private resolveStageFilter(): string | undefined {
    if (this.viewMode === 'geral') {
      return this.selectedStage;
    }

    if (this.viewMode === 'em-andamento') {
      return this.selectedInProgressStage;
    }

    return undefined;
  }

  getDirectionLabel(direction: string): string {
    return (direction || '').toUpperCase() === 'OUTBOUND' ? 'Você' : 'Contato';
  }

  getDirectionClass(direction: string): string {
    return (direction || '').toUpperCase() === 'OUTBOUND' ? 'msg-outbound' : 'msg-inbound';
  }

  trackByPhone(_: number, contact: ContactView) {
    return contact.phone;
  }

  getInitials(name: string | null): string {
    if (!name || !name.trim()) {
      return 'CT';
    }

    const parts = name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2);

    return parts.map((part) => part[0].toUpperCase()).join('');
  }

  getStageClass(stage: string): string {
    const value = (stage || '').toLowerCase();

    if (value.includes('rescuing')) {
      return 'stage-negotiation';
    }

    if (value.includes('recently_rescued')) {
      return 'stage-customer';
    }

    if (value.includes('lead')) {
      return 'stage-lead';
    }

    if (value.includes('negocia') || value.includes('proposta') || value.includes('proposal')) {
      return 'stage-negotiation';
    }

    if (value.includes('cliente') || value.includes('fechado') || value.includes('won') || value.includes('client')) {
      return 'stage-customer';
    }

    return 'stage-default';
  }

  shouldShowRescueOwner(contact: ContactView | null | undefined): boolean {
    if (!contact) {
      return false;
    }

    const stage = (contact.stage || '').trim().toUpperCase();
    return stage === 'RESCUING' || stage === 'RECENTLY_RESCUED';
  }

  getRescueOwnerLabel(contact: ContactView | null | undefined): string {
    if (!contact || !this.shouldShowRescueOwner(contact)) {
      return '';
    }

    const firstName = (contact.rescueOwnerName || '').trim();
    return firstName ? `Resgatando: ${firstName}` : 'Resgatando: Não definido';
  }

  formatPhone(phone: string | null | undefined): string {
    if (!phone) {
      return 'Não informado';
    }

    const normalized = phone.trim();
    if (!normalized) {
      return 'Não informado';
    }

    try {
      const parsed = parsePhoneNumberFromString(normalized.startsWith('+') ? normalized : `+${normalized.replace(/\D/g, '')}`);
      if (parsed?.isValid()) {
        return parsed.formatInternational();
      }
    } catch {
      // Fallback abaixo
    }

    const digits = normalized.replace(/\D/g, '');
    if (digits.length >= 10) {
      const fallbackParsed = parsePhoneNumberFromString(`+${digits}`, 'BR');
      if (fallbackParsed?.isValid()) {
        return fallbackParsed.formatInternational();
      }
    }

    return normalized;
  }

  private getWhatsappDigits(phone: string): string {
    const normalized = (phone || '').trim();
    if (!normalized) {
      return '';
    }

    try {
      const parsed = parsePhoneNumberFromString(normalized.startsWith('+') ? normalized : `+${normalized.replace(/\D/g, '')}`);
      if (parsed?.isValid()) {
        return parsed.number.replace(/\D/g, '');
      }
    } catch {
      // Fallback abaixo
    }

    return normalized.replace(/\D/g, '');
  }

  private createDefaultClientForm(): CreateClientRequest {
    return {
      fullName: '',
      phone: '',
      cpf: '',
      email: '',
      origin: 'RESGATE',
      sourceContactId: null,
      notes: ''
    };
  }

}
