package com.cstar.platform.whatsapp.dto;

import java.util.List;

public record ContactPageResponse(
        List<ContactListItemResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
}
