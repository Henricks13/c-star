export interface ProductTypeItem {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductTypeRequest {
  name: string;
  description?: string | null;
  active?: boolean;
}

export interface UpdateProductTypeRequest {
  name: string;
  description?: string | null;
  active?: boolean;
}
