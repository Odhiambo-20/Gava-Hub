package com.gavahub.payment.api;

import tools.jackson.databind.JsonNode;
import com.gavahub.payment.application.ProcessMpesaCallbackUseCase;
import com.gavahub.payment.infrastructure.daraja.MpesaCallbackVerifier;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks/mpesa")
public class MpesaCallbackController {
    private final ProcessMpesaCallbackUseCase callbacks;
    private final MpesaCallbackVerifier verifier;
    public MpesaCallbackController(ProcessMpesaCallbackUseCase callbacks, MpesaCallbackVerifier verifier) {
        this.callbacks = callbacks; this.verifier = verifier;
    }
    @PostMapping("/stk")
    public ResponseEntity<Void> stk(@RequestParam(value="token", required=false) String queryToken,
                                    @RequestHeader(value="X-Callback-Token", required=false) String headerToken,
                                    @RequestBody JsonNode payload) {
        String token = headerToken == null ? queryToken : headerToken;
        if (!verifier.valid(token)) throw new AccessDeniedException("Invalid M-Pesa callback token");
        callbacks.process(payload);
        return ResponseEntity.ok().build();
    }
}
