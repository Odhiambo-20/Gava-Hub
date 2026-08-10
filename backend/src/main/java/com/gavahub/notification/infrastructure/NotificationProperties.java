package com.gavahub.notification.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("gava-hub.notifications")
public record NotificationProperties(String fromEmail, String smsUrl, String smsApiKey, int maxAttempts) {
    public NotificationProperties { maxAttempts = maxAttempts <= 0 ? 5 : maxAttempts; }
}
