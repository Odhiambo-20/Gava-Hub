package com.gavahub.billing.application;

import com.gavahub.billing.domain.InvoiceSummary;
import com.gavahub.billing.infrastructure.InvoiceQueryRepository;
import com.gavahub.shared.exception.ResourceNotFoundException;
import java.util.UUID;
import java.util.List;
import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {
    private final InvoiceQueryRepository invoices;
    private final JdbcClient jdbc;
    public InvoiceService(InvoiceQueryRepository invoices, JdbcClient jdbc) { this.invoices = invoices; this.jdbc = jdbc; }
    @Transactional(readOnly = true)
    public InvoiceSummary get(UUID id) {
        return invoices.findById(id).orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
    }
    @Transactional(readOnly = true) public List<InvoiceSummary> list() { return invoices.findAll(); }
    @Transactional(readOnly = true) public List<InvoiceSummary> forUser(UUID userId) { return invoices.findForUser(userId); }
    @Transactional public InvoiceSummary create(UUID userId, UUID organizationId, UUID verificationId,
                                                 BigDecimal subtotal, BigDecimal tax, String currency, Instant dueAt) {
        if (userId == null && organizationId == null) throw new IllegalArgumentException("An invoice recipient is required");
        UUID id=UUID.randomUUID(); BigDecimal normalizedTax=tax == null ? BigDecimal.ZERO : tax;
        String number="INV-"+java.time.LocalDate.now().toString().replace("-","")+"-"+id.toString().substring(0,8).toUpperCase();
        jdbc.sql("""
                insert into gavahub.invoice(id,invoice_number,billed_user_id,billed_organization_id,verification_request_id,
                status,subtotal,tax,total,currency,due_at)
                values(:id,:number,:userId,:organizationId,:verificationId,'OPEN',:subtotal,:tax,:total,:currency,:dueAt)
                """).param("id",id).param("number",number).param("userId",userId).param("organizationId",organizationId)
                .param("verificationId",verificationId).param("subtotal",subtotal).param("tax",normalizedTax)
                .param("total",subtotal.add(normalizedTax)).param("currency",currency.toUpperCase()).param("dueAt",dueAt).update();
        return get(id);
    }
    @Transactional public InvoiceSummary update(UUID id, Instant dueAt, String status) {
        InvoiceSummary current=get(id);
        if ("PAID".equals(current.status()) && !"REFUNDED".equals(status))
            throw new com.gavahub.shared.exception.ConflictException("A paid invoice can only be refunded");
        jdbc.sql("update gavahub.invoice set due_at=:dueAt,status=:status where id=:id")
                .param("dueAt",dueAt).param("status",status).param("id",id).update(); return get(id);
    }
    @Transactional public void voidInvoice(UUID id) {
        InvoiceSummary current=get(id); if("PAID".equals(current.status()))
            throw new com.gavahub.shared.exception.ConflictException("Paid invoices cannot be voided");
        jdbc.sql("update gavahub.invoice set status='VOID' where id=:id").param("id",id).update();
    }
}
