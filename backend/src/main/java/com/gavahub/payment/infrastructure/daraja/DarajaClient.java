package com.gavahub.payment.infrastructure.daraja;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.gavahub.payment.domain.PaymentProvider;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import tools.jackson.databind.JsonNode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class DarajaClient implements PaymentProvider {
    private final RestClient restClient;
    private final DarajaTokenClient tokens;
    private final DarajaRequestMapper mapper;

    public DarajaClient(RestClient.Builder builder, DarajaProperties properties,
                        DarajaTokenClient tokens, DarajaRequestMapper mapper) {
        this.restClient = builder.baseUrl(properties.baseUrl()).build(); this.tokens = tokens; this.mapper = mapper;
    }

    @Override
    public ProviderResult initiate(UUID paymentId, String phone, BigDecimal amount, String reference) {
        Map<String, Object> request = mapper.stkPush(phone, amount, reference);
        StkResponse response = restClient.post().uri("/mpesa/stkpush/v1/processrequest")
                .headers(headers -> headers.setBearerAuth(tokens.accessToken()))
                .contentType(MediaType.APPLICATION_JSON).body(request).retrieve().body(StkResponse.class);
        if (response == null) throw new IllegalStateException("Daraja STK response was empty");
        return new ProviderResult(response.merchantRequestId(), response.checkoutRequestId(),
                response.responseCode(), response.responseDescription());
    }

    @Override
    public QueryResult query(String checkoutRequestId) {
        JsonNode response = restClient.post().uri("/mpesa/stkpushquery/v1/query")
                .headers(headers -> headers.setBearerAuth(tokens.accessToken()))
                .contentType(MediaType.APPLICATION_JSON).body(mapper.stkQuery(checkoutRequestId))
                .retrieve().body(JsonNode.class);
        if (response == null) throw new IllegalStateException("Daraja query response was empty");
        return new QueryResult(response.path("ResponseCode").asText(null), response.path("ResultCode").asText(null),
                response.path("ResultDesc").asText(null), response.toString());
    }

    private record StkResponse(
            @JsonProperty("MerchantRequestID") String merchantRequestId,
            @JsonProperty("CheckoutRequestID") String checkoutRequestId,
            @JsonProperty("ResponseCode") String responseCode,
            @JsonProperty("ResponseDescription") String responseDescription) {}
}
