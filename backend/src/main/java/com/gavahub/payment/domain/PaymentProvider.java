package com.gavahub.payment.domain;

import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentProvider {
    ProviderResult initiate(UUID paymentId, String phoneNumber, BigDecimal amount, String accountReference);
    QueryResult query(String checkoutRequestId);

    record ProviderResult(String merchantRequestId, String checkoutRequestId, String responseCode, String description) {}
    record QueryResult(String responseCode, String resultCode, String resultDescription, String payload) {
        public boolean completed() { return "0".equals(resultCode); }
        public boolean pending() { return resultCode == null || "1037".equals(resultCode); }
    }
}
