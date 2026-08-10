package com.gavahub.payment.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record Payment(
        UUID id,
        UUID invoiceId,
        UUID initiatedByUserId,
        String provider,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        String idempotencyKey,
        String failureCode,
        String failureReason,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt) {}
