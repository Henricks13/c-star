package com.cstar.platform.agenda;

import com.cstar.platform.agenda.model.AgendaEventType;
import com.cstar.platform.agenda.model.AgendaEventKind;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgendaEventTypeRepository extends JpaRepository<AgendaEventType, UUID> {

    List<AgendaEventType> findByActiveTrueOrderByNameAsc();

    Optional<AgendaEventType> findByIdAndActiveTrue(UUID id);

    Optional<AgendaEventType> findFirstByKindAndActiveTrue(AgendaEventKind kind);
}
