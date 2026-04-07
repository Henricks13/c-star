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
  price: number;
  durationMinutes?: number | null;
  active?: boolean;
  notes?: string | null;
  consumedProducts?: ServiceProductUsageInput[];
}

export interface UpdateServiceRequest {
  name: string;
  price: number;
  durationMinutes?: number | null;
  active?: boolean;
  notes?: string | null;
  consumedProducts?: ServiceProductUsageInput[];
}
