package com.gavahub.candidate.domain;

import java.time.Instant;
import java.util.UUID;

public record CandidateSummary(
        UUID id, UUID userId, String givenName, String familyName, String headline, String profileStatus, Instant createdAt) {}
