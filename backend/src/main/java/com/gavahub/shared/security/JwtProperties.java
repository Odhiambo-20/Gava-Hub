package com.gavahub.shared.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("gava-hub.security")
public record JwtProperties(String issuer, String audience, String jwtSecret, Duration tokenTtl) {
    public JwtProperties {
        issuer = issuer == null || issuer.isBlank() ? "gava-hub" : issuer;
        audience = audience == null || audience.isBlank() ? "gava-hub-api" : audience;
        tokenTtl = tokenTtl == null ? Duration.ofHours(1) : tokenTtl;
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalArgumentException("GAVA_HUB_JWT_SECRET must contain at least 32 characters");
        }
    }
}
