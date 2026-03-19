package com.cstar.platform.anamnesis;

import com.cstar.platform.anamnesis.model.AnamnesisQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AnamnesisQuestionRepository extends JpaRepository<AnamnesisQuestion, UUID> {

    List<AnamnesisQuestion> findAllByOrderByDisplayOrderAscCreatedAtAsc();

    List<AnamnesisQuestion> findByActiveTrueOrderByDisplayOrderAscCreatedAtAsc();

    boolean existsByDisplayOrder(int displayOrder);

    boolean existsByDisplayOrderAndIdNot(int displayOrder, UUID id);
}
