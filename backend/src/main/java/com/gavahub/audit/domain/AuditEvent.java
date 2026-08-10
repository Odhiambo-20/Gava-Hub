package com.gavahub.audit.domain;

import java.time.Instant;
import java.util.UUID;

public record AuditEvent(
        UUID actorUserId, UUID actorOrganizationId, String action, String resourceType,
        String resourceId, String outcome, String requestId, String eventData, Instant occurredAt) {}
