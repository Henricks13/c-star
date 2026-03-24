package com.cstar.platform.collaborators.dto;

import java.util.List;

public record CollaboratorTaskHistoryPageResponse(
        List<CollaboratorDailyTaskResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
}