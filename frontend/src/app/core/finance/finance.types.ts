export type IncomeSource = 'MANUAL' | 'PRODUCT_SALE' | 'SERVICE_ORDER';
export type FinanceIncomePaymentStatus = 'AGUARDANDO_PAGAMENTO' | 'PAGO';

export interface FinanceTypeItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTypeRequest {
  name: string;
  description?: string | null;
}

export interface FinanceIncomeItem {
  id: string;
  incomeTypeId: string;
  incomeTypeName: string;
  source: IncomeSource;
  referenceId: string | null;
  amount: number;
  description: string | null;
  notes: string | null;
  occurredOn: string;
  paymentStatus: FinanceIncomePaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceIncomeRequest {
  incomeTypeId: string;
  source: IncomeSource;
  referenceId?: string | null;
  amount: number;
  description?: string | null;
  notes?: string | null;
  occurredOn: string;
  paymentStatus?: FinanceIncomePaymentStatus | null;
}

export interface FinanceExpenseItem {
  id: string;
  expenseTypeId: string;
  expenseTypeName: string;
  amount: number;
  description: string | null;
  notes: string | null;
  occurredOn: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceExpenseRequest {
  expenseTypeId: string;
  amount: number;
  description?: string | null;
  notes?: string | null;
  occurredOn: string;
}

export interface ProductSaleItemRequest {
  productId: string;
  quantity: number;
}

export interface ProductSaleRequest {
  customerName?: string | null;
  notes?: string | null;
  occurredOn: string;
  items: ProductSaleItemRequest[];
}

export interface ProductSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ProductSale {
  id: string;
  customerName: string | null;
  notes: string | null;
  occurredOn: string;
  totalAmount: number;
  createdAt: string;
  items: ProductSaleItem[];
}

export interface FinanceReportItem {
  kind: 'ENTRADA' | 'SAIDA';
  id: string;
  occurredOn: string;
  category: string;
  description: string | null;
  amount: number;
  source: string | null;
  referenceId: string | null;
}

export interface FinanceReport {
  startDate: string | null;
  endDate: string | null;
  totalIncomes: number;
  totalExpenses: number;
  totalProfit: number;
  incomesCount: number;
  expensesCount: number;
  entries: FinanceReportItem[];
  exits: FinanceReportItem[];
}
