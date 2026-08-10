package com.gavahub.verification.domain;

import java.time.Instant;
import java.util.UUID;

public record VerificationSummary(
        UUID id, String referenceNumber, UUID candidateId, UUID requestingOrganizationId,
        String status, String purpose, Instant submittedAt, Instant completedAt, Instant createdAt) {}
