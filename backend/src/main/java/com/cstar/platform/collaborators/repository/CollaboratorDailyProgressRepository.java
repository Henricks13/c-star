package com.cstar.platform.collaborators.repository;

import com.cstar.platform.collaborators.model.CollaboratorDailyProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollaboratorDailyProgressRepository extends JpaRepository<CollaboratorDailyProgress, UUID> {

    Optional<CollaboratorDailyProgress> findByUserIdAndProgressDate(UUID userId, LocalDate progressDate);

    List<CollaboratorDailyProgress> findByUserIdInAndProgressDate(List<UUID> userIds, LocalDate progressDate);

    List<CollaboratorDailyProgress> findByUserIdAndProgressDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);
}
