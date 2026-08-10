package com.gavahub.verification.infrastructure;

import com.gavahub.verification.domain.VerificationSummary;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class VerificationQueryRepository {
    private final JdbcClient jdbc;
    public VerificationQueryRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public Optional<VerificationSummary> findById(UUID id) {
        return jdbc.sql("""
                select id, reference_number, candidate_id, requesting_organization_id, status,
                       purpose, submitted_at, completed_at, created_at
                from gavahub.verification_request where id = :id
                """).param("id", id).query(VerificationSummary.class).optional();
    }

    public List<VerificationSummary> findAll() {
        return jdbc.sql("""
                select id,reference_number,candidate_id,requesting_organization_id,status,
                       purpose,submitted_at,completed_at,created_at
                from gavahub.verification_request order by created_at desc
                """).query(VerificationSummary.class).list();
    }
}
