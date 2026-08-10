package com.gavahub.payment.infrastructure.daraja;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("gava-hub.mpesa")
public record DarajaProperties(
        String environment,
        String consumerKey,
        String consumerSecret,
        String shortcode,
        String passkey,
        String callbackBaseUrl,
        String callbackSecret,
        Duration connectTimeout,
        Duration readTimeout) {
    public String baseUrl() {
        return "production".equalsIgnoreCase(environment)
                ? "https://api.safaricom.co.ke"
                : "https://sandbox.safaricom.co.ke";
    }
    public boolean configured() {
        return consumerKey != null && !consumerKey.isBlank() && consumerSecret != null && !consumerSecret.isBlank()
                && shortcode != null && !shortcode.isBlank() && passkey != null && !passkey.isBlank()
                && callbackBaseUrl != null && !callbackBaseUrl.isBlank();
    }
}
