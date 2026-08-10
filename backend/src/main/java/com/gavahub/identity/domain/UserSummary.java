package com.gavahub.identity.domain;

import java.time.Instant;
import java.util.UUID;

public record UserSummary(UUID id, String email, String displayName, String status, Instant createdAt) {}
