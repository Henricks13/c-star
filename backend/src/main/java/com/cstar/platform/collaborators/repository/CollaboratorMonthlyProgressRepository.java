package com.cstar.platform.collaborators.repository;

import com.cstar.platform.collaborators.model.CollaboratorMonthlyProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollaboratorMonthlyProgressRepository extends JpaRepository<CollaboratorMonthlyProgress, UUID> {

    Optional<CollaboratorMonthlyProgress> findByUserIdAndReferenceMonth(UUID userId, LocalDate referenceMonth);

    List<CollaboratorMonthlyProgress> findByUserIdAndReferenceMonthBetweenOrderByReferenceMonthAsc(
            UUID userId,
            LocalDate startMonth,
            LocalDate endMonth
    );

    List<CollaboratorMonthlyProgress> findByUserIdInAndReferenceMonth(List<UUID> userIds, LocalDate referenceMonth);
}