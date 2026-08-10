package com.gavahub.payment.infrastructure.daraja;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.stereotype.Component;

@Component
public class MpesaCallbackVerifier {
    private final DarajaProperties properties;
    public MpesaCallbackVerifier(DarajaProperties properties) { this.properties = properties; }
    public boolean valid(String supplied) {
        String expected = properties.callbackSecret();
        return expected != null && !expected.isBlank() && supplied != null
                && MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), supplied.getBytes(StandardCharsets.UTF_8));
    }
}
