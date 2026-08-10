package com.gavahub.contact.domain;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class ContactModels {
    private ContactModels() {}

    public record SubmitContactRequest(
            @NotBlank @Size(max = 200) String fullName,
            @NotBlank @Email @Size(max = 320) String email,
            @Size(max = 30) String phoneNumber,
            @NotBlank @Pattern(regexp = "CANDIDATE|EMPLOYER|INSTITUTION|OTHER") String requesterType,
            @NotBlank @Size(min = 10, max = 5000) String message) {}

    public record ContactResponse(UUID id, String referenceNumber, String status, Instant createdAt) {}
}
