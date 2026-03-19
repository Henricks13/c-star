package com.cstar.platform.anamnesis;

import com.cstar.platform.anamnesis.model.ClientAnamnesisSubmissionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClientAnamnesisSubmissionAnswerRepository extends JpaRepository<ClientAnamnesisSubmissionAnswer, UUID> {

    List<ClientAnamnesisSubmissionAnswer> findBySubmissionIdOrderByDisplayOrderAscCreatedAtAsc(UUID submissionId);
}
