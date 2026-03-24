package com.cstar.platform.collaborators.repository;

import com.cstar.platform.collaborators.model.CollaboratorDailyGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollaboratorDailyGoalRepository extends JpaRepository<CollaboratorDailyGoal, UUID> {

    Optional<CollaboratorDailyGoal> findByUserIdAndGoalDate(UUID userId, LocalDate goalDate);

    List<CollaboratorDailyGoal> findByUserIdInAndGoalDate(List<UUID> userIds, LocalDate goalDate);

    List<CollaboratorDailyGoal> findByUserIdAndGoalDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);
}
