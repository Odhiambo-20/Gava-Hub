package com.gavahub.organization.domain;

import java.time.Instant;
import java.util.UUID;

public record OrganizationMemberSummary(UUID organizationId, UUID userId, String email,
        String displayName, String memberRole, String status, Instant joinedAt) {}
