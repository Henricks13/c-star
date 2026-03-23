import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { ProductItem } from 'src/app/core/products/products.types';
import { ProductsService } from 'src/app/core/products/products.service';
import { ServicesService } from 'src/app/core/services/services.service';
import {
  CreateServiceRequest,
  SERVICE_STAGE_OPTIONS,
  ServiceItem,
  ServiceProductUsageInput,
  ServiceStage,
  UpdateServiceRequest
} from 'src/app/core/services/services.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

interface ServiceFormModel {
  name: string;
  stage: ServiceStage;
  price: number;
  durationMinutes: number | null;
  active: boolean;
  notes: string;
  consumedProducts: Array<{ productId: string; quantityUsed: number }>;
}

@Component({
  selector: 'app-services',
  imports: [CommonModule, FormsModule, NgSelectModule, CardComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {
  loading = false;
  saving = false;
  togglingServiceId: string | null = null;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  services: ServiceItem[] = [];
  availableProducts: ProductItem[] = [];
  selectedService: ServiceItem | null = null;
  selectedServiceForDeletion: ServiceItem | null = null;

  createModalOpen = false;
  editModalOpen = false;
  deleteModalOpen = false;

  readonly stageOptions = SERVICE_STAGE_OPTIONS;

  createForm: ServiceFormModel = this.defaultForm();
  editForm: ServiceFormModel = this.defaultForm();

  constructor(
    private readonly servicesService: ServicesService,
    private readonly productsService: ProductsService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = null;

    this.productsService.list().subscribe({
      next: (products) => {
        this.availableProducts = products.filter((item) => item.active);
        this.servicesService.list().subscribe({
          next: (services) => {
            this.services = services;
            this.loading = false;
          },
          error: () => {
            this.errorMessage = 'Não foi possível carregar os serviços.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os produtos para composição de serviço.';
        this.loading = false;
      }
    });
  }

  openCreateModal(): void {
    this.createForm = this.defaultForm();
    this.errorMessage = null;
    this.infoMessage = null;
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  createService(): void {
    if (this.saving) {
      return;
    }

    const payload = this.normalizePayload(this.createForm);
    if (!payload) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.servicesService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeCreateModal();
        this.infoMessage = 'Serviço cadastrado com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível cadastrar o serviço.';
        this.saving = false;
      }
    });
  }

  openEditModal(service: ServiceItem): void {
    this.selectedService = service;
    this.editForm = {
      name: service.name,
      stage: service.stage,
      price: Number(service.price),
      durationMinutes: service.durationMinutes,
      active: service.active,
      notes: service.notes || '',
      consumedProducts: (service.consumedProducts || []).map((item) => ({
        productId: item.productId,
        quantityUsed: Number(item.quantityUsed)
      }))
    };

    this.errorMessage = null;
    this.infoMessage = null;
    this.editModalOpen = true;
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.selectedService = null;
  }

  updateService(): void {
    if (!this.selectedService || this.saving) {
      return;
    }

    const payload = this.normalizePayload(this.editForm);
    if (!payload) {
      return;
    }

    this.saving = true;
    this.errorMessage = null;

    this.servicesService.update(this.selectedService.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.infoMessage = 'Serviço atualizado com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível atualizar o serviço.';
        this.saving = false;
      }
    });
  }

  deleteService(service: ServiceItem): void {
    if (this.saving) {
      return;
    }

    this.selectedServiceForDeletion = service;
    this.deleteModalOpen = true;
    this.errorMessage = null;
    this.infoMessage = null;
  }

  closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.selectedServiceForDeletion = null;
  }

  confirmDeleteService(): void {
    if (!this.selectedServiceForDeletion || this.saving) {
      return;
    }

    this.saving = true;

    this.errorMessage = null;
    this.infoMessage = null;

    this.servicesService.delete(this.selectedServiceForDeletion.id).subscribe({
      next: () => {
        this.saving = false;
        this.closeDeleteModal();
        this.infoMessage = 'Serviço removido com sucesso.';
        this.loadAll();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Não foi possível excluir o serviço.';
      }
    });
  }

  toggleServiceActive(service: ServiceItem, nextActive: boolean): void {
    if (this.togglingServiceId) {
      return;
    }

    const payload: UpdateServiceRequest = {
      name: service.name,
      stage: service.stage,
      price: Number(service.price),
      durationMinutes: service.durationMinutes,
      active: nextActive,
      notes: service.notes,
      consumedProducts: (service.consumedProducts || []).map((item) => ({
        productId: item.productId,
        quantityUsed: Number(item.quantityUsed)
      }))
    };

    this.togglingServiceId = service.id;
    this.errorMessage = null;
    this.infoMessage = null;

    this.servicesService.update(service.id, payload).subscribe({
      next: (updated) => {
        service.active = updated.active;
        this.infoMessage = updated.active ? 'Serviço ativado com sucesso.' : 'Serviço desativado com sucesso.';
        this.togglingServiceId = null;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível alterar o status do serviço.';
        this.togglingServiceId = null;
      }
    });
  }

  getStageLabel(stage: string | null | undefined): string {
    const value = (stage || '').trim().toUpperCase();
    const found = this.stageOptions.find((option) => option.value === value);
    return found?.label || stage || 'Não informado';
  }

  addConsumedProduct(formModel: ServiceFormModel): void {
    formModel.consumedProducts.push({
      productId: '',
      quantityUsed: 1
    });
  }

  removeConsumedProduct(formModel: ServiceFormModel, index: number): void {
    formModel.consumedProducts.splice(index, 1);
  }

  private normalizePayload(formModel: ServiceFormModel): CreateServiceRequest | UpdateServiceRequest | null {
    const consumedProducts: ServiceProductUsageInput[] = formModel.consumedProducts
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantityUsed: Number(item.quantityUsed)
      }));

    const payload: CreateServiceRequest = {
      name: (formModel.name || '').trim(),
      stage: formModel.stage,
      price: Number(formModel.price),
      durationMinutes: formModel.durationMinutes ? Number(formModel.durationMinutes) : null,
      active: formModel.active !== false,
      notes: (formModel.notes || '').trim() || null,
      consumedProducts
    };

    return this.validatePayload(payload);
  }

  private validatePayload<T extends CreateServiceRequest | UpdateServiceRequest>(payload: T): T | null {
    if (!payload.name || !payload.stage) {
      this.errorMessage = 'Preencha nome e etapa do serviço.';
      return null;
    }

    if (Number.isNaN(payload.price) || payload.price < 0) {
      this.errorMessage = 'Preço do serviço não pode ser negativo.';
      return null;
    }

    if (payload.durationMinutes != null && (Number.isNaN(payload.durationMinutes) || payload.durationMinutes <= 0)) {
      this.errorMessage = 'Duração deve ser maior que zero.';
      return null;
    }

    const ids = payload.consumedProducts?.map((item) => item.productId) || [];
    if (new Set(ids).size !== ids.length) {
      this.errorMessage = 'Não repita o mesmo produto na composição do serviço.';
      return null;
    }

    if ((payload.consumedProducts || []).some((item) => Number.isNaN(item.quantityUsed) || item.quantityUsed <= 0)) {
      this.errorMessage = 'Quantidade usada deve ser maior que zero.';
      return null;
    }

    return payload;
  }

  private defaultForm(): ServiceFormModel {
    return {
      name: '',
      stage: 'ORCAMENTO',
      price: 0,
      durationMinutes: null,
      active: true,
      notes: '',
      consumedProducts: []
    };
  }
}
