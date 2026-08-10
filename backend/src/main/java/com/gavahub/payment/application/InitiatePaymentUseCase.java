package com.gavahub.payment.application;

import com.gavahub.payment.domain.Payment;
import java.util.UUID;

public interface InitiatePaymentUseCase {
    Payment initiate(UUID invoiceId, UUID userId, String phoneNumber, String idempotencyKey);
}
