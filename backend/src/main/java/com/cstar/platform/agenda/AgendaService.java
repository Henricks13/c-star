package com.cstar.platform.agenda;

import com.cstar.platform.agenda.dto.AgendaEventResponse;
import com.cstar.platform.agenda.dto.AgendaEventTypeResponse;
import com.cstar.platform.agenda.dto.CreateAgendaEventRequest;
import com.cstar.platform.agenda.model.AgendaEvent;
import com.cstar.platform.agenda.model.AgendaEventKind;
import com.cstar.platform.agenda.model.AgendaEventType;
import com.cstar.platform.clients.ClientRepository;
import com.cstar.platform.clients.model.Client;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AgendaService {

    private static final Set<String> ALLOWED_COLORS = Set.of(
            "#3B82F6",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#8B5CF6",
            "#06B6D4",
            "#EC4899",
            "#6B7280"
    );

    private final AgendaEventTypeRepository eventTypeRepository;
    private final AgendaEventRepository eventRepository;
    private final ClientRepository clientRepository;

    public AgendaService(
            AgendaEventTypeRepository eventTypeRepository,
            AgendaEventRepository eventRepository,
            ClientRepository clientRepository
    ) {
        this.eventTypeRepository = eventTypeRepository;
        this.eventRepository = eventRepository;
        this.clientRepository = clientRepository;
    }

    @Transactional(readOnly = true)
    public List<AgendaEventTypeResponse> listTypes() {
        return eventTypeRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toTypeResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AgendaEventResponse> listEvents(Instant start, Instant end) {
        if (start == null || end == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Período inicial e final são obrigatórios");
        }

        if (!start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Período inválido para listagem da agenda");
        }

        return eventRepository.findByStartAtBetweenOrderByStartAtAsc(start, end)
                .stream()
                .map(this::toEventResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AgendaEventResponse findEventById(UUID id) {
        AgendaEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento da agenda não encontrado"));

        return toEventResponse(event);
    }

    @Transactional
    public AgendaEventResponse createEvent(CreateAgendaEventRequest request) {
        AgendaEventType type = eventTypeRepository.findByIdAndActiveTrue(request.typeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de evento inválido"));

        Client client = null;
        if (type.isRequiresClient() && request.clientId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente é obrigatório para este tipo de evento");
        }

        if (request.clientId() != null) {
            client = clientRepository.findById(request.clientId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente não encontrado"));
        }

        Integer durationMinutes = resolveDuration(type, request.durationMinutes());
        String color = normalizeColor(request.color());

        String title = normalizeTitle(request.title());
        String notes = normalizeNotes(request.notes());

        AgendaEvent event = AgendaEvent.create(
                type,
                client,
                title,
                notes,
                color,
                request.startAt(),
                durationMinutes
        );

        AgendaEvent saved = eventRepository.save(event);

        if (type.getKind() == AgendaEventKind.AVALIACAO && client != null) {
            client.markEvaluationScheduled();
            clientRepository.save(client);
        }

        return toEventResponse(saved);
    }

    private Integer resolveDuration(AgendaEventType type, Integer requestedDuration) {
        int duration;
        if (type.isAllowsCustomDuration()) {
            duration = requestedDuration != null ? requestedDuration : type.getDefaultDurationMinutes();
        } else {
            duration = type.getDefaultDurationMinutes();
        }

        if (duration <= 0 || duration > 1440) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duração do evento deve estar entre 1 e 1440 minutos");
        }

        return duration;
    }

    private String normalizeTitle(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Título do evento precisa ter ao menos 2 caracteres");
        }
        return normalized;
    }

    private String normalizeNotes(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeColor(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_COLORS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cor inválida para o evento");
        }
        return normalized;
    }

    private AgendaEventTypeResponse toTypeResponse(AgendaEventType item) {
        return new AgendaEventTypeResponse(
                item.getId(),
                item.getName(),
                item.getKind().name(),
                item.getDefaultDurationMinutes(),
                item.isAllowsCustomDuration(),
                item.isRequiresClient(),
                item.getColor()
        );
    }

    private AgendaEventResponse toEventResponse(AgendaEvent event) {
        Instant endAt = event.getStartAt().plus(event.getDurationMinutes(), ChronoUnit.MINUTES);
        Client client = event.getClient();
        return new AgendaEventResponse(
                event.getId(),
                event.getEventType().getId(),
                event.getEventType().getName(),
                event.getEventType().getKind().name(),
                event.getTitle(),
                event.getNotes(),
                event.getColor(),
                event.getStartAt(),
                endAt,
                event.getDurationMinutes(),
                client != null ? client.getId() : null,
                client != null ? client.getFullName() : null,
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
