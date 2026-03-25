package com.cstar.platform.agenda;

import com.cstar.platform.agenda.model.AgendaEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgendaEventRepository extends JpaRepository<AgendaEvent, UUID> {

    List<AgendaEvent> findByStartAtBetweenOrderByStartAtAsc(Instant start, Instant end);

    void deleteByClientId(UUID clientId);

        @Query(value = """
                        select *
                        from calendar_events e
                        where e.start_at < :candidateEnd
                            and (e.start_at + (e.duration_minutes * interval '1 minute')) > :candidateStart
                        order by e.start_at asc
                        limit 1
                        """, nativeQuery = true)
        Optional<AgendaEvent> findFirstConflict(
                        @Param("candidateStart") Instant candidateStart,
                        @Param("candidateEnd") Instant candidateEnd
        );
}
