export type AgendaEventKind = 'EVENTO' | 'AVALIACAO' | 'RETORNO';

export interface AgendaEventTypeItem {
  id: string;
  name: string;
  kind: AgendaEventKind;
  defaultDurationMinutes: number;
  allowsCustomDuration: boolean;
  requiresClient: boolean;
  color: string;
}

export interface AgendaEventItem {
  id: string;
  typeId: string;
  typeName: string;
  typeKind: AgendaEventKind;
  title: string;
  notes: string | null;
  color: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  clientId: string | null;
  clientName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgendaEventRequest {
  typeId: string;
  title: string;
  startAt: string;
  durationMinutes?: number | null;
  color: string;
  notes?: string | null;
  clientId?: string | null;
}

export const AGENDA_FIXED_COLORS: string[] = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#6B7280'];
