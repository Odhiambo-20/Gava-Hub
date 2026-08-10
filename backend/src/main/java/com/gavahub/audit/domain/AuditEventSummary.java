package com.gavahub.audit.domain;

import java.time.Instant;
import java.util.UUID;

public record AuditEventSummary(UUID id, UUID actorUserId, String action, String resourceType,
        String resourceId, String outcome, String requestId, Instant occurredAt) {}
