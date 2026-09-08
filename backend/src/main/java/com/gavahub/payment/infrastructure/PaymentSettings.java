package com.gavahub.payment.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@Validated
@ConfigurationProperties("gava-hub.payments")
public record PaymentSettings(
        @NotNull Method method,
        @Pattern(regexp = "[0-9]{6}") String coopPaybillNumber,
        @Pattern(regexp = "[0-9]+") String coopAccountNumber) {
    public enum Method { COOP_PAYBILL, DARAJA }

    // Co-op collection stays unavailable until its verified bank adapter is implemented.
    // An environment flag must not enable unverified payment acceptance.
    public boolean available() { return method == Method.DARAJA; }
}
