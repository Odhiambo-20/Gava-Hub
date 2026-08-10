package com.gavahub.payment.infrastructure.daraja;

import static org.assertj.core.api.Assertions.assertThat;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class MpesaCallbackVerifierTests {
    private final MpesaCallbackVerifier verifier = new MpesaCallbackVerifier(new DarajaProperties(
            "sandbox","key","secret","174379","passkey","https://example.test/callback",
            "callback-secret",Duration.ofSeconds(5),Duration.ofSeconds(20)));
    @Test void acceptsOnlyTheConfiguredSecret() {
        assertThat(verifier.valid("callback-secret")).isTrue();
        assertThat(verifier.valid("wrong-secret")).isFalse();
        assertThat(verifier.valid(null)).isFalse();
    }
}
