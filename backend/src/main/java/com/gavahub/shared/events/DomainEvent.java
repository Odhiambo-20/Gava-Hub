package com.gavahub.shared.events;

import java.time.Instant;
import java.util.UUID;

public interface DomainEvent {
    UUID aggregateId();

    Instant occurredAt();
}
