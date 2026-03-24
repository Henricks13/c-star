package com.cstar.platform.collaborators.dto;

import java.time.LocalDate;
import java.util.List;

public record CollaboratorPanelResponse(
        LocalDate date,
        List<CollaboratorPanelItemResponse> collaborators
) {
}
