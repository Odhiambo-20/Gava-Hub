package com.gavahub.billing.infrastructure;

import com.gavahub.billing.domain.InvoiceSummary;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class InvoiceQueryRepository {
    private final JdbcClient jdbc;
    public InvoiceQueryRepository(JdbcClient jdbc) { this.jdbc = jdbc; }
    public Optional<InvoiceSummary> findById(UUID id) {
        return jdbc.sql("""
                select id, invoice_number, billed_user_id, billed_organization_id, status,
                       total, currency, due_at, paid_at, created_at
                from gavahub.invoice where id = :id
                """).param("id", id).query(InvoiceSummary.class).optional();
    }
    public List<InvoiceSummary> findAll() {
        return jdbc.sql("""
                select id,invoice_number,billed_user_id,billed_organization_id,status,total,currency,due_at,paid_at,created_at
                from gavahub.invoice order by created_at desc
                """).query(InvoiceSummary.class).list();
    }
    public List<InvoiceSummary> findForUser(UUID userId) {
        return jdbc.sql("""
                select id,invoice_number,billed_user_id,billed_organization_id,status,total,currency,due_at,paid_at,created_at
                from gavahub.invoice where billed_user_id=:userId order by created_at desc
                """).param("userId",userId).query(InvoiceSummary.class).list();
    }
}
