export type OrderProductSource = 'SERVICE_COMPOSITION' | 'EXTRA';
export type ClientServiceOrderStatus = 'ORCADO' | 'AGUARDANDO_PAGAMENTO' | 'PAGO';
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

export interface ClientServiceOrderItem {
  id: string;
  clientId: string;
  subtotalServices: number;
  subtotalExtraProducts: number;
  discountAmount: number;
  customTotalEnabled: boolean;
  customTotalValue: number | null;
  finalTotal: number;
  notes: string | null;
  status: ClientServiceOrderStatus;
  paymentMethod: ServicePaymentMethod | null;
  installmentCount: number | null;
  paidInstallmentCount: number | null;
  paidAt: string | null;
  services: ClientServiceOrderServiceItem[];
  products: ClientServiceOrderProductItem[];
  createdAt: string;
  updatedAt: string;
}
