package com.gavahub.organization.domain;

import java.time.Instant;
import java.util.UUID;

public record OrganizationSummary(
        UUID id, String legalName, String tradingName, String organizationType, String status, Instant createdAt) {}
