package com.gavahub.identity.domain;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AuthModels {
    private AuthModels() {}
    public record RegisterRequest(@Email @NotBlank String email,
                                  @NotBlank @Size(min = 8, max = 100) String password,
                                  @NotBlank @Size(max = 200) String displayName,
                                  String phoneNumber,
                                  @jakarta.validation.constraints.Pattern(regexp = "CANDIDATE|EMPLOYER|INSTITUTION")
                                  String accountType) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record TokenResponse(String accessToken, String tokenType, Instant expiresAt,
                                UUID userId, List<String> roles) {}
}
