package com.cstar.platform.collaborators.repository;

import com.cstar.platform.collaborators.model.CollaboratorMonthlyGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollaboratorMonthlyGoalRepository extends JpaRepository<CollaboratorMonthlyGoal, UUID> {

    Optional<CollaboratorMonthlyGoal> findByUserIdAndReferenceMonth(UUID userId, LocalDate referenceMonth);

    List<CollaboratorMonthlyGoal> findByUserIdAndReferenceMonthBetweenOrderByReferenceMonthAsc(
            UUID userId,
            LocalDate startMonth,
            LocalDate endMonth
    );

    List<CollaboratorMonthlyGoal> findByUserIdInAndReferenceMonth(List<UUID> userIds, LocalDate referenceMonth);
}
