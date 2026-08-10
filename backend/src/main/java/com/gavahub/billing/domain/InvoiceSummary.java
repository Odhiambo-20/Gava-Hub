package com.gavahub.billing.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record InvoiceSummary(
        UUID id, String invoiceNumber, UUID billedUserId, UUID billedOrganizationId, String status,
        BigDecimal total, String currency, Instant dueAt, Instant paidAt, Instant createdAt) {}
