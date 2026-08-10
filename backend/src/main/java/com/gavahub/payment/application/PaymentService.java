package com.gavahub.payment.application;

import tools.jackson.databind.JsonNode;
import com.gavahub.payment.domain.*;
import com.gavahub.shared.exception.ConflictException;
import com.gavahub.shared.exception.ResourceNotFoundException;
import com.gavahub.shared.validation.PhoneNumbers;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService implements InitiatePaymentUseCase, ProcessMpesaCallbackUseCase, ReconcilePaymentUseCase {
    private final PaymentRepository payments;
    private final PaymentProvider provider;
    private final JdbcClient jdbc;
    private final ApplicationEventPublisher events;

    public PaymentService(PaymentRepository payments, PaymentProvider provider, JdbcClient jdbc,
                          ApplicationEventPublisher events) {
        this.payments = payments; this.provider = provider; this.jdbc = jdbc; this.events = events;
    }

    @Override
    @Transactional
    public Payment initiate(UUID invoiceId, UUID userId, String phoneNumber, String idempotencyKey) {
        var prior = payments.findByIdempotencyKey(idempotencyKey);
        if (prior.isPresent()) return prior.get();
        InvoiceAmount invoice = jdbc.sql("select total, currency, status from gavahub.invoice where id = :id")
                .param("id", invoiceId).query(InvoiceAmount.class).optional()
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        if (!"OPEN".equals(invoice.status())) throw new ConflictException("Invoice is not open for payment");
        Instant now = Instant.now();
        Payment created = payments.save(new Payment(UUID.randomUUID(), invoiceId, userId, "MPESA", invoice.total(),
                invoice.currency(), PaymentStatus.CREATED, idempotencyKey, null, null, null, now, now));
        String phone = PhoneNumbers.normalizeKenyan(phoneNumber);
        PaymentProvider.ProviderResult result = provider.initiate(
                created.id(), phone, created.amount(), "INV-" + invoiceId.toString().substring(0, 8));
        jdbc.sql("""
                insert into gavahub.mpesa_transaction
                    (payment_id, transaction_type, phone_number_hash, merchant_request_id, checkout_request_id)
                values (:paymentId, 'STK_PUSH', encode(digest(:phone, 'sha256'), 'hex'), :merchant, :checkout)
                """).param("paymentId", created.id()).param("phone", phone)
                .param("merchant", result.merchantRequestId()).param("checkout", result.checkoutRequestId()).update();
        Payment pending = new Payment(created.id(), created.invoiceId(), created.initiatedByUserId(), created.provider(),
                created.amount(), created.currency(), PaymentStatus.PENDING, created.idempotencyKey(), null, null,
                null, created.createdAt(), Instant.now());
        return payments.save(pending);
    }

    public Payment get(UUID id) {
        return payments.findById(id).orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    }
    public List<Payment> forUser(UUID userId) { return payments.findByUserId(userId); }

    @Override
    @Transactional
    public void process(JsonNode payload) {
        JsonNode callback = payload.path("Body").path("stkCallback");
        String checkout = callback.path("CheckoutRequestID").asText();
        if (checkout.isBlank()) throw new IllegalArgumentException("Missing CheckoutRequestID");
        int resultCode = callback.path("ResultCode").asInt(-1);
        String eventKey = "stk:" + checkout;
        int accepted = jdbc.sql("""
                insert into gavahub.payment_webhook_event(provider,event_key,payload,processing_status,signature_valid)
                values('MPESA',:eventKey,cast(:payload as jsonb),'PROCESSING',true)
                on conflict(event_key) do nothing
                """).param("eventKey", eventKey).param("payload", payload.toString()).update();
        if (accepted == 0) return;
        UUID paymentId = jdbc.sql("select payment_id from gavahub.mpesa_transaction where checkout_request_id = :id")
                .param("id", checkout).query(UUID.class).optional()
                .orElseThrow(() -> new ResourceNotFoundException("Unknown M-Pesa checkout request"));
        Payment current = get(paymentId);
        if (current.status() == PaymentStatus.COMPLETED) {
            markWebhook(eventKey, "DUPLICATE", null); return;
        }
        PaymentStatus status = resultCode == 0 ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
        Instant completed = resultCode == 0 ? Instant.now() : null;
        Payment updated = payments.save(new Payment(current.id(), current.invoiceId(), current.initiatedByUserId(),
                current.provider(), current.amount(), current.currency(), status, current.idempotencyKey(),
                Integer.toString(resultCode), callback.path("ResultDesc").asText(), completed,
                current.createdAt(), Instant.now()));
        JsonNode metadata = callback.path("CallbackMetadata").path("Item");
        String receipt = metadata(metadata, "MpesaReceiptNumber");
        String transactionDate = metadata(metadata, "TransactionDate");
        jdbc.sql("""
                update gavahub.mpesa_transaction set result_code=:code,result_description=:description,
                mpesa_receipt_number=coalesce(:receipt,mpesa_receipt_number),
                transaction_at=case when :transactionDate is null then transaction_at
                    else to_timestamp(:transactionDate,'YYYYMMDDHH24MISS') end,
                response_payload=cast(:payload as jsonb) where payment_id=:paymentId
                """)
                .param("code", Integer.toString(resultCode)).param("description", callback.path("ResultDesc").asText())
                .param("receipt", receipt).param("transactionDate", transactionDate)
                .param("payload", payload.toString()).param("paymentId", paymentId).update();
        if (status == PaymentStatus.COMPLETED) {
            jdbc.sql("update gavahub.invoice set status='PAID', paid_at=clock_timestamp() where id=:id")
                    .param("id", current.invoiceId()).update();
            events.publishEvent(new PaymentCompletedEvent(updated.id(), updated.invoiceId(), Instant.now()));
        }
        markWebhook(eventKey, "PROCESSED", null);
    }

    @Override
    @Scheduled(fixedDelayString = "${gava-hub.mpesa.reconciliation-delay:PT5M}")
    public void reconcilePendingPayments() {
        jdbc.sql("""
                select p.id,mt.checkout_request_id from gavahub.payment p
                join gavahub.mpesa_transaction mt on mt.payment_id=p.id
                where p.status in ('PENDING','UNKNOWN','RECONCILING')
                  and p.updated_at < clock_timestamp() - interval '2 minutes'
                order by p.updated_at limit 50
                """).query(PendingPayment.class).list().forEach(this::reconcile);
    }

    private void reconcile(PendingPayment pending) {
        try {
            jdbc.sql("update gavahub.payment set status='RECONCILING' where id=:id").param("id", pending.id()).update();
            PaymentProvider.QueryResult result = provider.query(pending.checkoutRequestId());
            String outcome = result.completed() ? "MATCHED" : result.pending() ? "PENDING" : "MISMATCH";
            jdbc.sql("""
                    insert into gavahub.payment_reconciliation(payment_id,provider_status,result,response_payload)
                    values(:id,:providerStatus,:result,cast(:payload as jsonb))
                    """).param("id",pending.id()).param("providerStatus",result.resultCode())
                    .param("result",outcome).param("payload",result.payload()).update();
            Payment current=get(pending.id());
            PaymentStatus status=result.completed()?PaymentStatus.COMPLETED:result.pending()?PaymentStatus.PENDING:PaymentStatus.FAILED;
            payments.save(new Payment(current.id(),current.invoiceId(),current.initiatedByUserId(),current.provider(),
                    current.amount(),current.currency(),status,current.idempotencyKey(),result.resultCode(),
                    result.resultDescription(),result.completed()?Instant.now():null,current.createdAt(),Instant.now()));
            if(result.completed()) jdbc.sql("update gavahub.invoice set status='PAID',paid_at=clock_timestamp() where id=:id")
                    .param("id",current.invoiceId()).update();
        } catch (RuntimeException exception) {
            jdbc.sql("""
                    insert into gavahub.payment_reconciliation(payment_id,result,error_message)
                    values(:id,'FAILED',:error)
                    """).param("id",pending.id()).param("error",safeMessage(exception)).update();
            jdbc.sql("update gavahub.payment set status='UNKNOWN' where id=:id").param("id",pending.id()).update();
        }
    }

    private String metadata(JsonNode items, String name) {
        if (!items.isArray()) return null;
        for (JsonNode item : items) if (name.equals(item.path("Name").asText())) return item.path("Value").asText(null);
        return null;
    }
    private void markWebhook(String eventKey,String status,String error) {
        jdbc.sql("""
                update gavahub.payment_webhook_event set processing_status=:status,error_message=:error,
                processed_at=clock_timestamp() where event_key=:eventKey
                """).param("status",status).param("error",error).param("eventKey",eventKey).update();
    }
    private String safeMessage(Exception exception) {
        String message=exception.getMessage(); if(message==null) return exception.getClass().getSimpleName();
        return message.substring(0,Math.min(message.length(),1000));
    }

    private record InvoiceAmount(BigDecimal total, String currency, String status) {}
    private record PendingPayment(UUID id,String checkoutRequestId) {}
}
