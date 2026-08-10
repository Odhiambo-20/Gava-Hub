package com.gavahub.payment.domain;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface PaymentRepository {
    Payment save(Payment payment);
    Optional<Payment> findById(UUID id);
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    List<Payment> findByUserId(UUID userId);
}
