package com.cstar.platform.collaborators.repository;

import com.cstar.platform.collaborators.model.CollaboratorDailyTask;
import com.cstar.platform.collaborators.model.CollaboratorTaskType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollaboratorDailyTaskRepository extends JpaRepository<CollaboratorDailyTask, UUID> {

    List<CollaboratorDailyTask> findByUserIdAndTaskDateOrderByCreatedAtAsc(UUID userId, LocalDate taskDate);

    List<CollaboratorDailyTask> findByUserIdInAndTaskDate(List<UUID> userIds, LocalDate taskDate);

    List<CollaboratorDailyTask> findByUserIdAndTaskTypeAndTaskDateOrderByCreatedAtAsc(
            UUID userId,
            CollaboratorTaskType taskType,
            LocalDate taskDate
    );

    List<CollaboratorDailyTask> findByUserIdAndTaskTypeOrderByCreatedAtDesc(UUID userId, CollaboratorTaskType taskType);

    long countByUserId(UUID userId);

    long countByUserIdAndCompletedTrue(UUID userId);

    long countByUserIdAndTaskTypeAndTaskDate(UUID userId, CollaboratorTaskType taskType, LocalDate taskDate);

    long countByUserIdAndTaskTypeAndTaskDateAndCompletedTrue(UUID userId, CollaboratorTaskType taskType, LocalDate taskDate);

    Page<CollaboratorDailyTask> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Optional<CollaboratorDailyTask> findByIdAndUserId(UUID id, UUID userId);
}

