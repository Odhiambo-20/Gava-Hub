package com.gavahub.credential.domain;

import java.time.LocalDate;
import java.util.UUID;

public record CredentialSummary(
        UUID id, UUID candidateId, UUID issuingOrganizationId, String credentialType, String title,
        String credentialNumber, LocalDate issuedOn, LocalDate expiresOn, String status) {}
