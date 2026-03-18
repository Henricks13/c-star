import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ClientsService } from 'src/app/core/clients/clients.service';
import { CLIENT_ORIGIN_OPTIONS, ClientListItem, CreateClientRequest } from 'src/app/core/clients/clients.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-clients',
  imports: [CommonModule, FormsModule, CardComponent],
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

  readonly originOptions = CLIENT_ORIGIN_OPTIONS;

  form: CreateClientRequest = this.createDefaultForm();

  constructor(private readonly clientsService: ClientsService) {}

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
}
