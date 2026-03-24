package com.cstar.platform.collaborators;

import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.collaborators.dto.AddCollaboratorTaskRequest;
import com.cstar.platform.collaborators.dto.CollaboratorDailyTaskResponse;
import com.cstar.platform.collaborators.dto.CollaboratorManagementResponse;
import com.cstar.platform.collaborators.dto.CollaboratorMonthlyHistoryItemResponse;
import com.cstar.platform.collaborators.dto.CollaboratorPanelResponse;
import com.cstar.platform.collaborators.dto.CollaboratorTaskHistoryPageResponse;
import com.cstar.platform.collaborators.dto.SetCollaboratorGoalRequest;
import com.cstar.platform.collaborators.dto.SetCollaboratorMonthlyGoalRequest;
import com.cstar.platform.collaborators.dto.UpdateCollaboratorTaskStatusRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/collaborators")
public class CollaboratorPanelController {

    private final CollaboratorPanelService collaboratorPanelService;

    public CollaboratorPanelController(CollaboratorPanelService collaboratorPanelService) {
        this.collaboratorPanelService = collaboratorPanelService;
    }

    @GetMapping("/panel")
    public CollaboratorPanelResponse getPanel(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestParam(required = false) LocalDate date
    ) {
        return collaboratorPanelService.getCollaboratorsPanel(principal, date);
    }

    @GetMapping("/{userId}/management")
    public CollaboratorManagementResponse getManagement(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID userId,
            @RequestParam(required = false) LocalDate date
    ) {
        return collaboratorPanelService.getCollaboratorManagement(principal, userId, date);
    }

    @GetMapping("/{userId}/tasks/history")
    public CollaboratorTaskHistoryPageResponse getTaskHistory(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return collaboratorPanelService.getTaskHistory(principal, userId, page, size);
    }

    @GetMapping("/{userId}/monthly-history")
    public List<CollaboratorMonthlyHistoryItemResponse> getMonthlyHistory(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID userId,
            @RequestParam(required = false) Integer months
    ) {
        return collaboratorPanelService.getMonthlyHistory(principal, userId, months);
    }

    @PutMapping("/{userId}/goal")
    public void setGoal(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID userId,
            @RequestBody @Valid SetCollaboratorGoalRequest request
    ) {
        collaboratorPanelService.setGoal(principal, userId, request);
    }

    @PutMapping("/{userId}/monthly-goal")
    public void setMonthlyGoal(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID userId,
            @RequestBody @Valid SetCollaboratorMonthlyGoalRequest request
    ) {
        collaboratorPanelService.setMonthlyGoal(principal, userId, request);
    }

    @PostMapping("/{userId}/tasks")
    public CollaboratorDailyTaskResponse addTask(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID userId,
            @RequestBody @Valid AddCollaboratorTaskRequest request
    ) {
        return collaboratorPanelService.addTask(principal, userId, request);
    }

    @PatchMapping("/{userId}/tasks/{taskId}")
    public CollaboratorDailyTaskResponse updateTaskStatus(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID userId,
            @PathVariable UUID taskId,
            @RequestBody @Valid UpdateCollaboratorTaskStatusRequest request
    ) {
        return collaboratorPanelService.updateTaskStatusAsManager(principal, userId, taskId, request);
    }

    @DeleteMapping("/{userId}/tasks/{taskId}")
    public void deleteTask(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID userId,
            @PathVariable UUID taskId
    ) {
        collaboratorPanelService.deleteTaskAsManager(principal, userId, taskId);
    }
}
