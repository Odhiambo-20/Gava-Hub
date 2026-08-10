package com.gavahub.payment.domain;

public enum PaymentStatus {
    CREATED,
    PENDING,
    COMPLETED,
    FAILED,
    CANCELLED,
    EXPIRED,
    UNKNOWN,
    RECONCILING,
    REVERSED
}
