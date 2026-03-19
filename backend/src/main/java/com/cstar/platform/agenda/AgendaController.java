package com.cstar.platform.agenda;

import com.cstar.platform.agenda.dto.AgendaEventResponse;
import com.cstar.platform.agenda.dto.AgendaEventTypeResponse;
import com.cstar.platform.agenda.dto.CreateAgendaEventRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agenda")
public class AgendaController {

    private final AgendaService agendaService;

    public AgendaController(AgendaService agendaService) {
        this.agendaService = agendaService;
    }

    @GetMapping("/types")
    public List<AgendaEventTypeResponse> listTypes() {
        return agendaService.listTypes();
    }

    @GetMapping("/events")
    public List<AgendaEventResponse> listEvents(
            @RequestParam Instant start,
            @RequestParam Instant end
    ) {
        return agendaService.listEvents(start, end);
    }

    @GetMapping("/events/{id}")
    public AgendaEventResponse findEventById(@PathVariable UUID id) {
        return agendaService.findEventById(id);
    }

    @PostMapping("/events")
    public AgendaEventResponse createEvent(@RequestBody @Valid CreateAgendaEventRequest request) {
        return agendaService.createEvent(request);
    }
}
