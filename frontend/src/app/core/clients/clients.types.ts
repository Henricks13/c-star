export type ClientOrigin = 'RESGATE' | 'CADASTRO_MANUAL' | 'CADASTRO_INDICADO' | 'OUTROS';
export type ClientBusinessStatus = 'NEGOCIACAO' | 'NEGOCIO_FECHADO';

export interface ClientOriginOption {
  value: ClientOrigin;
  label: string;
}

export const CLIENT_ORIGIN_OPTIONS: ClientOriginOption[] = [
  { value: 'RESGATE', label: 'Resgate' },
  { value: 'CADASTRO_MANUAL', label: 'Cadastrado Manual' },
  { value: 'CADASTRO_INDICADO', label: 'Cadastrado Indicado' },
  { value: 'OUTROS', label: 'Outros' }
];

export interface ClientListItem {
  id: string;
  fullName: string;
  phone: string;
  cpf: string | null;
  email: string | null;
  origin: ClientOrigin;
  businessStatus: ClientBusinessStatus;
  sourceContactId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  fullName: string;
  phone: string;
  cpf?: string | null;
  email?: string | null;
  origin: ClientOrigin;
  sourceContactId?: string | null;
  notes?: string | null;
}
