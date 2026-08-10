package com.gavahub.payment.application;

import tools.jackson.databind.JsonNode;

public interface ProcessMpesaCallbackUseCase {
    void process(JsonNode payload);
}
