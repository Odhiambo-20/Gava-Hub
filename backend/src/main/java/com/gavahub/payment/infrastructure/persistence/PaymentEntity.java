package com.gavahub.payment.infrastructure.persistence;

import com.gavahub.payment.domain.Payment;
import com.gavahub.payment.domain.PaymentStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment", schema = "gavahub")
public class PaymentEntity {
    @Id private UUID id;
    @Column(name = "invoice_id", nullable = false) private UUID invoiceId;
    @Column(name = "initiated_by_user_id", nullable = false) private UUID initiatedByUserId;
    @Column(nullable = false) private String provider;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal amount;
    @Column(nullable = false, length = 3) private String currency;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private PaymentStatus status;
    @Column(name = "idempotency_key", nullable = false, unique = true) private String idempotencyKey;
    @Column(name = "failure_code") private String failureCode;
    @Column(name = "failure_reason") private String failureReason;
    @Column(name = "completed_at") private Instant completedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected PaymentEntity() {}

    static PaymentEntity from(Payment payment) {
        PaymentEntity entity = new PaymentEntity();
        entity.id = payment.id(); entity.invoiceId = payment.invoiceId();
        entity.initiatedByUserId = payment.initiatedByUserId(); entity.provider = payment.provider();
        entity.amount = payment.amount(); entity.currency = payment.currency(); entity.status = payment.status();
        entity.idempotencyKey = payment.idempotencyKey(); entity.failureCode = payment.failureCode();
        entity.failureReason = payment.failureReason(); entity.completedAt = payment.completedAt();
        entity.createdAt = payment.createdAt(); entity.updatedAt = payment.updatedAt();
        return entity;
    }

    Payment toDomain() {
        return new Payment(id, invoiceId, initiatedByUserId, provider, amount, currency, status,
                idempotencyKey, failureCode, failureReason, completedAt, createdAt, updatedAt);
    }
}
