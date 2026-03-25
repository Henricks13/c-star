export type ClientOrigin =
  | 'LEAD_TRAFEGO_PAGO'
  | 'INDICACAO'
  | 'PACIENTE_ANTIGO'
  | 'REDES_SOCIAIS'
  | 'RESGATE'
  | 'CADASTRO_MANUAL'
  | 'CADASTRO_INDICADO'
  | 'OUTROS';
export type ClientBusinessStatus = 'NEGOCIACAO' | 'AVALIACAO_MARCADA' | 'NEGOCIO_FECHADO';

export interface ClientOriginOption {
  value: ClientOrigin;
  label: string;
}

export const CLIENT_ORIGIN_OPTIONS: ClientOriginOption[] = [
  { value: 'LEAD_TRAFEGO_PAGO', label: 'Lead Tráfego Pago' },
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'PACIENTE_ANTIGO', label: 'Paciente Antigo' },
  { value: 'REDES_SOCIAIS', label: 'Redes Sociais' }
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

export interface UpdateClientRequest {
  fullName: string;
  phone: string;
  cpf?: string | null;
  email?: string | null;
  origin: ClientOrigin;
  notes?: string | null;
}

export interface ClientObservationItem {
  id: string;
  clientId: string;
  note: string;
  createdByName: string | null;
  createdAt: string;
}

export interface AddClientObservationRequest {
  note: string;
}
