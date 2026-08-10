package com.gavahub.document.domain;

import java.time.Instant;
import java.util.UUID;

public record DocumentSummary(
        UUID id, UUID ownerUserId, UUID ownerOrganizationId, String originalFilename,
        String contentType, long sizeBytes, String malwareScanStatus, Instant createdAt) {}
