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
  perishable: boolean;
  expirationDate: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku?: string | null;
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
  sku?: string | null;
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
