package com.gavahub.payment.domain;

import com.gavahub.shared.events.DomainEvent;
import java.time.Instant;
import java.util.UUID;

public record PaymentCompletedEvent(UUID aggregateId, UUID invoiceId, Instant occurredAt) implements DomainEvent {}
