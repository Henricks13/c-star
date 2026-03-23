package com.cstar.platform.clients;

import com.cstar.platform.clients.model.ClientObservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClientObservationRepository extends JpaRepository<ClientObservation, UUID> {

    List<ClientObservation> findByClientIdOrderByCreatedAtDesc(UUID clientId);
}
