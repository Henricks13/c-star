package com.cstar.platform.agenda;

import com.cstar.platform.agenda.model.AgendaEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AgendaEventRepository extends JpaRepository<AgendaEvent, UUID> {

    List<AgendaEvent> findByStartAtBetweenOrderByStartAtAsc(Instant start, Instant end);
}
