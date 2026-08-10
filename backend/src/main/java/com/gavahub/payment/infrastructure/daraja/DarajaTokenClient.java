package com.gavahub.payment.infrastructure.daraja;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class DarajaTokenClient {
    private final RestClient restClient;
    private final DarajaProperties properties;
    private volatile CachedToken cached;

    public DarajaTokenClient(RestClient.Builder builder, DarajaProperties properties) {
        this.restClient = builder.baseUrl(properties.baseUrl()).build();
        this.properties = properties;
    }

    public synchronized String accessToken() {
        if (!properties.configured()) throw new IllegalStateException("M-Pesa credentials are not configured");
        if (cached != null && cached.expiresAt().isAfter(Instant.now().plusSeconds(30))) return cached.value();
        TokenResponse response = restClient.get()
                .uri("/oauth/v1/generate?grant_type=client_credentials")
                .headers(headers -> headers.setBasicAuth(properties.consumerKey(), properties.consumerSecret()))
                .retrieve().body(TokenResponse.class);
        if (response == null || response.accessToken() == null) throw new IllegalStateException("Daraja token response was empty");
        long seconds = response.expiresIn() == null ? 3000 : Long.parseLong(response.expiresIn());
        cached = new CachedToken(response.accessToken(), Instant.now().plusSeconds(seconds));
        return cached.value();
    }

    private record CachedToken(String value, Instant expiresAt) {}
    private record TokenResponse(@JsonProperty("access_token") String accessToken,
                                 @JsonProperty("expires_in") String expiresIn) {}
}
