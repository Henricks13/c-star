package com.cstar.platform.collaborators;

import com.cstar.platform.auth.security.AuthUserPrincipal;
import com.cstar.platform.collaborators.dto.CollaboratorDailyTaskResponse;
import com.cstar.platform.collaborators.dto.MyPanelResponse;
import com.cstar.platform.collaborators.dto.UpdateCollaboratorTaskStatusRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/me/panel")
public class MyPanelController {

    private final CollaboratorPanelService collaboratorPanelService;

    public MyPanelController(CollaboratorPanelService collaboratorPanelService) {
        this.collaboratorPanelService = collaboratorPanelService;
    }

    @GetMapping
    public MyPanelResponse getMyPanel(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @RequestParam(required = false) LocalDate date
    ) {
        return collaboratorPanelService.getMyPanel(principal, date);
    }

    @PatchMapping("/tasks/{taskId}")
    public CollaboratorDailyTaskResponse updateMyTaskStatus(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable UUID taskId,
            @RequestBody @Valid UpdateCollaboratorTaskStatusRequest request
    ) {
        return collaboratorPanelService.updateMyTaskStatus(principal, taskId, request);
    }
}
