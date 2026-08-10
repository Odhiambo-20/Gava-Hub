package com.gavahub.payment.infrastructure.daraja;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class DarajaRequestMapper {
    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private final DarajaProperties properties;
    public DarajaRequestMapper(DarajaProperties properties) { this.properties = properties; }

    public Map<String, Object> stkPush(String phone, BigDecimal amount, String reference) {
        String timestamp = timestamp();
        String password = password(timestamp);
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("BusinessShortCode", properties.shortcode()); request.put("Password", password);
        request.put("Timestamp", timestamp); request.put("TransactionType", "CustomerPayBillOnline");
        request.put("Amount", amount.setScale(0, java.math.RoundingMode.HALF_UP).intValueExact());
        request.put("PartyA", phone); request.put("PartyB", properties.shortcode()); request.put("PhoneNumber", phone);
        request.put("CallBackURL", properties.callbackBaseUrl() + "/stk?token="
                + java.net.URLEncoder.encode(properties.callbackSecret(), StandardCharsets.UTF_8));
        request.put("AccountReference", reference); request.put("TransactionDesc", "Gava Hub payment");
        return request;
    }

    public Map<String, Object> stkQuery(String checkoutRequestId) {
        String timestamp = timestamp();
        return Map.of("BusinessShortCode", properties.shortcode(), "Password", password(timestamp),
                "Timestamp", timestamp, "CheckoutRequestID", checkoutRequestId);
    }

    private String timestamp() { return LocalDateTime.now(ZoneOffset.UTC).format(TIMESTAMP); }
    private String password(String timestamp) { return Base64.getEncoder().encodeToString(
            (properties.shortcode() + properties.passkey() + timestamp).getBytes(StandardCharsets.UTF_8)); }
}
