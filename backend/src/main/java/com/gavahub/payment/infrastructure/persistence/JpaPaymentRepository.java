package com.gavahub.payment.infrastructure.persistence;

import com.gavahub.payment.domain.Payment;
import com.gavahub.payment.domain.PaymentRepository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

interface SpringDataPaymentRepository extends JpaRepository<PaymentEntity, UUID> {
    Optional<PaymentEntity> findByIdempotencyKey(String idempotencyKey);
    List<PaymentEntity> findByInitiatedByUserIdOrderByCreatedAtDesc(UUID userId);
}

@Repository
public class JpaPaymentRepository implements PaymentRepository {
    private final SpringDataPaymentRepository repository;
    public JpaPaymentRepository(SpringDataPaymentRepository repository) { this.repository = repository; }
    public Payment save(Payment payment) { return repository.save(PaymentEntity.from(payment)).toDomain(); }
    public Optional<Payment> findById(UUID id) { return repository.findById(id).map(PaymentEntity::toDomain); }
    public Optional<Payment> findByIdempotencyKey(String key) {
        return repository.findByIdempotencyKey(key).map(PaymentEntity::toDomain);
    }
    public List<Payment> findByUserId(UUID userId) {
        return repository.findByInitiatedByUserIdOrderByCreatedAtDesc(userId).stream().map(PaymentEntity::toDomain).toList();
    }
}
