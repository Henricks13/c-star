export type OrderProductSource = 'SERVICE_COMPOSITION' | 'EXTRA';
export type ClientServiceOrderStatus = 'ORCADO' | 'AGENDADO' | 'AGUARDANDO_RETORNO' | 'FINALIZADO';
export type ClientServiceOrderPaymentStatus = 'ORCADO' | 'AGUARDANDO_PAGAMENTO' | 'PAGAMENTO_PARCIAL' | 'PAGAMENTO_CONCLUIDO';
export type ServicePaymentMethod = 'PIX' | 'CREDIT_CARD' | 'PIX_INSTALLMENT' | 'CASH' | 'TRADE';

export interface CreateClientServiceOrderExtraProductInput {
  productId: string;
  quantityUsed: number;
}

export interface CreateClientServiceOrderRequest {
  orderId?: string;
  clientId: string;
  serviceIds: string[];
  extraProducts?: CreateClientServiceOrderExtraProductInput[];
  discountAmount?: number;
  customTotalEnabled?: boolean;
  customTotalValue?: number | null;
  notes?: string | null;
}

export interface ConfirmClientServiceOrderPaymentRequest {
  paymentMethod: ServicePaymentMethod;
  installmentCount?: number | null;
  paid: boolean;
  firstInstallmentPaid?: boolean | null;
}

export interface CreateClientServiceOrderPaymentPlanRequest {
  paymentMethod: ServicePaymentMethod;
  installmentCount: number;
  downPaymentEnabled?: boolean;
  downPaymentAmount?: number | null;
  customSplitPaymentEnabled?: boolean;
  downPaymentMethod?: ServicePaymentMethod | null;
  remainingPaymentMethod?: ServicePaymentMethod | null;
}

export interface AddClientServiceOrderObservationRequest {
  note: string;
}

export interface ScheduleClientServiceOrderReturnRequest {
  returnAt: string;
}

export interface ScheduleClientServiceOrderRequest {
  scheduledAt: string;
}

export interface ClientServiceOrderServiceItem {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
}

export interface ClientServiceOrderProductItem {
  id: string;
  productId: string;
  source: OrderProductSource;
  productName: string;
  quantityUsed: number;
  salePrice: number;
}

export interface ClientServiceOrderObservationItem {
  id: string;
  note: string;
  createdAt: string;
}

export interface ClientServiceOrderReturnItem {
  id: string;
  returnAt: string;
  createdAt: string;
}

export interface ClientServiceOrderItem {
  id: string;
  clientId: string;
  clientName: string;
  subtotalServices: number;
  subtotalExtraProducts: number;
  discountAmount: number;
  customTotalEnabled: boolean;
  customTotalValue: number | null;
  finalTotal: number;
  notes: string | null;
  status: string;
  serviceStatus: ClientServiceOrderStatus;
  paymentStatus: ClientServiceOrderPaymentStatus;
  paymentMethod: ServicePaymentMethod | null;
  installmentCount: number | null;
  paidInstallmentCount: number | null;
  paidAt: string | null;
  scheduledAt: string | null;
  nextReturnAt: string | null;
  services: ClientServiceOrderServiceItem[];
  products: ClientServiceOrderProductItem[];
  observations: ClientServiceOrderObservationItem[];
  returns: ClientServiceOrderReturnItem[];
  createdAt: string;
  updatedAt: string;
}
