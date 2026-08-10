package com.gavahub.payment.api;

import com.gavahub.payment.application.PaymentService;
import com.gavahub.payment.domain.Payment;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.util.UUID;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService payments;
    public PaymentController(PaymentService payments) { this.payments = payments; }

    @PostMapping("/mpesa/stk-push")
    public ResponseEntity<Payment> initiate(
            @RequestHeader("Idempotency-Key") @NotBlank String idempotencyKey,
            @Valid @RequestBody InitiateMpesaRequest request) {
        Payment payment = payments.initiate(request.invoiceId(), request.userId(), request.phoneNumber(), idempotencyKey);
        return ResponseEntity.created(URI.create("/api/v1/payments/" + payment.id())).body(payment);
    }

    @GetMapping("/{id}")
    public Payment get(@PathVariable UUID id) { return payments.get(id); }
    @GetMapping public List<Payment> list(@RequestParam UUID userId) { return payments.forUser(userId); }

    public record InitiateMpesaRequest(@NotNull UUID invoiceId, @NotNull UUID userId, @NotBlank String phoneNumber) {}
}
