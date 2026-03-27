export interface ProductItem {
  id: string;
  name: string;
  sku: string | null;
  productTypeId: string;
  productTypeName: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minimumStock: number;
  lastAdjustmentOperation: StockAdjustmentOperation | null;
  lastAdjustmentQuantity: number | null;
  lastAdjustmentAt: string | null;
  perishable: boolean;
  expirationDate: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  productTypeId: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minimumStock: number;
  perishable?: boolean;
  expirationDate?: string | null;
  active?: boolean;
  notes?: string | null;
}

export interface UpdateProductRequest {
  name: string;
  productTypeId: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minimumStock: number;
  perishable?: boolean;
  expirationDate?: string | null;
  active?: boolean;
  notes?: string | null;
}

export type StockAdjustmentOperation = 'ADD' | 'REMOVE';

export interface StockAdjustmentRequest {
  operation: StockAdjustmentOperation;
  quantity: number;
  customUnitPrice?: number | null;
  expirationDate?: string | null;
  notes?: string | null;
}
