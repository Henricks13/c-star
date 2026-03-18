package com.cstar.platform.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FinanceReportItemResponse(
        String kind,
        UUID id,
        LocalDate occurredOn,
        String category,
        String description,
        BigDecimal amount,
        String source,
        UUID referenceId
) {
}
