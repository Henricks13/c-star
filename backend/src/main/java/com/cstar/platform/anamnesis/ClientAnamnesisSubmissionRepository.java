package com.cstar.platform.anamnesis;

import com.cstar.platform.anamnesis.model.ClientAnamnesisSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClientAnamnesisSubmissionRepository extends JpaRepository<ClientAnamnesisSubmission, UUID> {

    Optional<ClientAnamnesisSubmission> findByClientId(UUID clientId);

    boolean existsByClientId(UUID clientId);
}
