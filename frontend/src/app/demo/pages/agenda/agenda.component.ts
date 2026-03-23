import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { forkJoin } from 'rxjs';

import { AgendaService } from 'src/app/core/agenda/agenda.service';
import { AGENDA_FIXED_COLORS, AgendaEventItem, AgendaEventTypeItem, CreateAgendaEventRequest } from 'src/app/core/agenda/agenda.types';
import { ClientsService } from 'src/app/core/clients/clients.service';
import { ClientListItem } from 'src/app/core/clients/clients.types';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

interface AgendaCreateForm {
  typeId: string;
  title: string;
  date: string;
  time: string;
  durationMinutes: number | null;
  color: string;
  notes: string;
  clientId: string;
}

interface AgendaCalendarDay {
  date: Date;
  dayLabel: string;
  dateLabel: string;
}

@Component({
  selector: 'app-agenda',
  imports: [CommonModule, FormsModule, NgSelectModule, CardComponent],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit {
  loading = false;
  saving = false;

  errorMessage: string | null = null;
  infoMessage: string | null = null;

  eventTypes: AgendaEventTypeItem[] = [];
  clients: ClientListItem[] = [];
  events: AgendaEventItem[] = [];

  weekStart = this.getStartOfWeek(new Date());

  createModalOpen = false;
  detailsModalOpen = false;
  selectedEvent: AgendaEventItem | null = null;

  readonly colorOptions = AGENDA_FIXED_COLORS;

  createForm: AgendaCreateForm = this.defaultCreateForm();

  constructor(
    private readonly agendaService: AgendaService,
    private readonly clientsService: ClientsService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  get weekDays(): AgendaCalendarDay[] {
    return Array.from({ length: 7 }, (_, index) => {
      const date = this.addDays(this.weekStart, index);
      const dayLabel = date
        .toLocaleDateString('pt-BR', { weekday: 'short' })
        .replace('.', '')
        .toUpperCase();
      const dateLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      return {
        date,
        dayLabel,
        dateLabel
      };
    });
  }

  get selectedType(): AgendaEventTypeItem | null {
    return this.eventTypes.find((item) => item.id === this.createForm.typeId) || null;
  }

  get requiresClient(): boolean {
    return !!this.selectedType?.requiresClient;
  }

  get allowsCustomDuration(): boolean {
    return !!this.selectedType?.allowsCustomDuration;
  }

  get weekLabel(): string {
    const start = this.weekStart;
    const end = this.addDays(start, 6);
    const startLabel = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const endLabel = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${startLabel} - ${endLabel}`;
  }

  loadInitialData(): void {
    this.loading = true;
    this.errorMessage = null;

    forkJoin({
      types: this.agendaService.listTypes(),
      clients: this.clientsService.list()
    }).subscribe({
      next: ({ types, clients }) => {
        this.eventTypes = types;
        this.clients = clients;

        if (!this.createForm.typeId && this.eventTypes.length > 0) {
          this.createForm.typeId = this.eventTypes[0].id;
          this.onTypeChange();
        }

        this.loadEventsForCurrentWeek();
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os dados da agenda.';
        this.loading = false;
      }
    });
  }

  loadEventsForCurrentWeek(): void {
    const start = new Date(this.weekStart);
    start.setHours(0, 0, 0, 0);

    const end = this.addDays(this.weekStart, 6);
    end.setHours(23, 59, 59, 999);

    this.agendaService.listEvents(start.toISOString(), end.toISOString()).subscribe({
      next: (events) => {
        this.events = events;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar os eventos da agenda.';
        this.loading = false;
      }
    });
  }

  previousWeek(): void {
    this.weekStart = this.addDays(this.weekStart, -7);
    this.loading = true;
    this.loadEventsForCurrentWeek();
  }

  nextWeek(): void {
    this.weekStart = this.addDays(this.weekStart, 7);
    this.loading = true;
    this.loadEventsForCurrentWeek();
  }

  goToCurrentWeek(): void {
    this.weekStart = this.getStartOfWeek(new Date());
    this.loading = true;
    this.loadEventsForCurrentWeek();
  }

  eventsForDay(day: Date): AgendaEventItem[] {
    return this.events
      .filter((event) => this.isSameDate(new Date(event.startAt), day))
      .sort((first, second) => new Date(first.startAt).getTime() - new Date(second.startAt).getTime());
  }

  openCreateModal(): void {
    this.errorMessage = null;
    this.infoMessage = null;
    this.createForm = this.defaultCreateForm();

    if (this.eventTypes.length > 0) {
      this.createForm.typeId = this.eventTypes[0].id;
      this.onTypeChange();
    }

    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
  }

  onTypeChange(): void {
    const selected = this.selectedType;
    if (!selected) {
      return;
    }

    this.createForm.color = selected.color;

    if (!selected.allowsCustomDuration) {
      this.createForm.durationMinutes = null;
    } else if (!this.createForm.durationMinutes) {
      this.createForm.durationMinutes = selected.defaultDurationMinutes;
    }

    if (!selected.requiresClient) {
      this.createForm.clientId = '';
    }
  }

  createEvent(): void {
    if (this.saving) {
      return;
    }

    const selectedType = this.selectedType;
    if (!selectedType) {
      this.errorMessage = 'Selecione um tipo de evento.';
      return;
    }

    const title = (this.createForm.title || '').trim();
    if (title.length < 2) {
      this.errorMessage = 'Informe um título válido para o evento.';
      return;
    }

    if (!this.createForm.date || !this.createForm.time) {
      this.errorMessage = 'Informe data e horário do evento.';
      return;
    }

    if (selectedType.requiresClient && !this.createForm.clientId) {
      this.errorMessage = 'Selecione um cliente para este tipo de evento.';
      return;
    }

    const startAt = this.buildDateTimeIso(this.createForm.date, this.createForm.time);
    if (!startAt) {
      this.errorMessage = 'Data e horário inválidos.';
      return;
    }

    const payload: CreateAgendaEventRequest = {
      typeId: selectedType.id,
      title,
      startAt,
      durationMinutes: selectedType.allowsCustomDuration ? Number(this.createForm.durationMinutes || selectedType.defaultDurationMinutes) : undefined,
      color: this.createForm.color,
      notes: (this.createForm.notes || '').trim() || null,
      clientId: selectedType.requiresClient ? this.createForm.clientId : null
    };

    this.saving = true;
    this.errorMessage = null;

    this.agendaService.createEvent(payload).subscribe({
      next: () => {
        this.saving = false;
        this.createModalOpen = false;
        this.infoMessage = 'Evento cadastrado com sucesso na agenda.';
        this.loading = true;
        this.loadEventsForCurrentWeek();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Não foi possível cadastrar o evento.';
        this.saving = false;
      }
    });
  }

  openDetails(event: AgendaEventItem): void {
    this.selectedEvent = event;
    this.detailsModalOpen = true;
  }

  closeDetailsModal(): void {
    this.detailsModalOpen = false;
    this.selectedEvent = null;
  }

  formatTime(value: string): string {
    return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(value: string): string {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTypeKindLabel(kind: string): string {
    const normalized = (kind || '').trim().toUpperCase();
    if (normalized === 'AVALIACAO') {
      return 'Avaliação';
    }
    if (normalized === 'RETORNO') {
      return 'Retorno';
    }
    return 'Evento';
  }

  trackByEventId(_: number, event: AgendaEventItem): string {
    return event.id;
  }

  private defaultCreateForm(): AgendaCreateForm {
    const now = new Date();
    const date = this.toDateInputValue(now);
    const time = `${String(now.getHours()).padStart(2, '0')}:00`;

    return {
      typeId: '',
      title: '',
      date,
      time,
      durationMinutes: null,
      color: this.colorOptions[0],
      notes: '',
      clientId: ''
    };
  }

  private toDateInputValue(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildDateTimeIso(date: string, time: string): string | null {
    const composed = new Date(`${date}T${time}:00`);
    if (Number.isNaN(composed.getTime())) {
      return null;
    }
    return composed.toISOString();
  }

  private getStartOfWeek(date: Date): Date {
    const source = new Date(date);
    source.setHours(0, 0, 0, 0);
    const day = source.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    source.setDate(source.getDate() + diff);
    return source;
  }

  private addDays(value: Date, days: number): Date {
    const result = new Date(value);
    result.setDate(result.getDate() + days);
    return result;
  }

  private isSameDate(first: Date, second: Date): boolean {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }
}
