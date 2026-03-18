export type ServiceStage = 'PLANEJAMENTO' | 'ORCAMENTO' | 'AGENDADO' | 'EXECUCAO' | 'POS_ATENDIMENTO' | 'FINALIZADO';

export interface ServiceStageOption {
  value: ServiceStage;
  label: string;
}

export const SERVICE_STAGE_OPTIONS: ServiceStageOption[] = [
  { value: 'PLANEJAMENTO', label: 'Planejamento' },
  { value: 'ORCAMENTO', label: 'Orçamento' },
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'EXECUCAO', label: 'Execução' },
  { value: 'POS_ATENDIMENTO', label: 'Pós-atendimento' },
  { value: 'FINALIZADO', label: 'Finalizado' }
];

export interface ServiceProductUsageInput {
  productId: string;
  quantityUsed: number;
}

export interface ServiceProductUsageItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  quantityUsed: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  stage: ServiceStage;
  price: number;
  durationMinutes: number | null;
  active: boolean;
  notes: string | null;
  consumedProducts: ServiceProductUsageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  stage: ServiceStage;
  price: number;
  durationMinutes?: number | null;
  active?: boolean;
  notes?: string | null;
  consumedProducts?: ServiceProductUsageInput[];
}

export interface UpdateServiceRequest {
  name: string;
  stage: ServiceStage;
  price: number;
  durationMinutes?: number | null;
  active?: boolean;
  notes?: string | null;
  consumedProducts?: ServiceProductUsageInput[];
}
