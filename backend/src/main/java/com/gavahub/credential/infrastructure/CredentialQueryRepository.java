package com.gavahub.credential.infrastructure;

import com.gavahub.credential.domain.CredentialSummary;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class CredentialQueryRepository {
    private final JdbcClient jdbc;

    public CredentialQueryRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public Optional<CredentialSummary> findById(UUID id) {
        return jdbc.sql("""
                select id, candidate_id, issuing_organization_id, credential_type, title,
                       credential_number, issued_on, expires_on, status
                from gavahub.credential where id = :id
                """).param("id", id).query(CredentialSummary.class).optional();
    }

    public List<CredentialSummary> findByCandidate(UUID candidateId) {
        return jdbc.sql("""
                select id, candidate_id, issuing_organization_id, credential_type, title,
                       credential_number, issued_on, expires_on, status
                from gavahub.credential where candidate_id = :candidateId order by created_at desc
                """).param("candidateId", candidateId).query(CredentialSummary.class).list();
    }
}
