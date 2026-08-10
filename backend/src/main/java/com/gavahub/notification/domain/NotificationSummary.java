package com.gavahub.notification.domain;

import java.time.Instant;
import java.util.UUID;

public record NotificationSummary(
        UUID id, UUID recipientUserId, String channel, String templateCode, String status,
        int attemptCount, Instant sentAt, Instant createdAt) {}
