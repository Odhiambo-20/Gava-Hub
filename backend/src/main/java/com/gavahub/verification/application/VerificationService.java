package com.gavahub.verification.application;

import com.gavahub.shared.exception.ResourceNotFoundException;
import com.gavahub.verification.domain.VerificationSummary;
import com.gavahub.verification.infrastructure.VerificationQueryRepository;
import java.util.UUID;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VerificationService {
    private final VerificationQueryRepository requests;
    private final JdbcClient jdbc;
    public VerificationService(VerificationQueryRepository requests, JdbcClient jdbc) { this.requests = requests; this.jdbc = jdbc; }
    @Transactional(readOnly = true)
    public VerificationSummary get(UUID id) {
        return requests.findById(id).orElseThrow(() -> new ResourceNotFoundException("Verification request not found"));
    }
    @Transactional(readOnly = true) public List<VerificationSummary> list() { return requests.findAll(); }
    @Transactional public VerificationSummary create(UUID requestedBy, UUID organizationId, UUID candidateId,
                                                       UUID consentId, String purpose) {
        if (organizationId == null) throw new IllegalArgumentException("A requesting organization is required");
        if (consentId == null) {
            consentId = UUID.randomUUID();
            jdbc.sql("""
                    insert into gavahub.consent(id,candidate_id,granted_to_organization_id,purpose,scope)
                    values(:id,:candidateId,:organizationId,:purpose,'{"credentials":true}'::jsonb)
                    """).param("id",consentId).param("candidateId",candidateId)
                    .param("organizationId",organizationId).param("purpose",purpose.trim()).update();
        }
        UUID id = UUID.randomUUID();
        String reference = "VR-" + java.time.LocalDate.now().toString().replace("-", "") + "-"
                + id.toString().substring(0, 8).toUpperCase();
        jdbc.sql("""
                insert into gavahub.verification_request
                (id,reference_number,requested_by_user_id,requesting_organization_id,candidate_id,consent_id,purpose)
                values(:id,:reference,:userId,:organizationId,:candidateId,:consentId,:purpose)
                """).param("id", id).param("reference", reference).param("userId", requestedBy)
                .param("organizationId", organizationId).param("candidateId", candidateId)
                .param("consentId", consentId).param("purpose", purpose.trim()).update();
        return get(id);
    }
    @Transactional public VerificationSummary update(UUID id, String purpose, String status) {
        get(id);
        jdbc.sql("""
                update gavahub.verification_request set purpose=:purpose,status=:status,
                submitted_at=case when :status='SUBMITTED' and submitted_at is null then clock_timestamp() else submitted_at end,
                completed_at=case when :status='COMPLETED' then clock_timestamp() else completed_at end where id=:id
                """).param("purpose", purpose.trim()).param("status", status).param("id", id).update();
        return get(id);
    }
    @Transactional public void cancel(UUID id) {
        VerificationSummary current = get(id);
        if ("COMPLETED".equals(current.status())) throw new com.gavahub.shared.exception.ConflictException("Completed verification cannot be cancelled");
        jdbc.sql("update gavahub.verification_request set status='CANCELLED' where id=:id").param("id", id).update();
    }
    @Transactional public VerificationSummary decide(UUID requestId,UUID credentialId,UUID decidedBy,
                                                       UUID assignedOrganizationId,String decision,String notes){
        get(requestId);UUID itemId=jdbc.sql("""
                insert into gavahub.verification_item(verification_request_id,credential_id,assigned_organization_id,status)
                values(:requestId,:credentialId,:organizationId,'IN_REVIEW')
                on conflict(verification_request_id,credential_id) do update set assigned_organization_id=excluded.assigned_organization_id
                returning id
                """).param("requestId",requestId).param("credentialId",credentialId)
                .param("organizationId",assignedOrganizationId).query(UUID.class).single();
        jdbc.sql("""
                insert into gavahub.verification_decision(verification_item_id,decided_by_user_id,decision,notes)
                values(:itemId,:userId,:decision,:notes)
                """).param("itemId",itemId).param("userId",decidedBy).param("decision",decision).param("notes",notes).update();
        jdbc.sql("update gavahub.verification_item set status=:decision where id=:id")
                .param("decision",decision).param("id",itemId).update();
        if("VERIFIED".equals(decision)||"REJECTED".equals(decision))
            jdbc.sql("update gavahub.credential set status=:decision where id=:id")
                    .param("decision",decision).param("id",credentialId).update();
        jdbc.sql("""
                update gavahub.verification_request set status=case
                  when exists(select 1 from gavahub.verification_item where verification_request_id=:id and status in ('PENDING','IN_REVIEW','MORE_INFORMATION_REQUIRED')) then 'IN_REVIEW'
                  else 'COMPLETED' end,
                  completed_at=case when not exists(select 1 from gavahub.verification_item where verification_request_id=:id and status in ('PENDING','IN_REVIEW','MORE_INFORMATION_REQUIRED')) then clock_timestamp() else null end
                where id=:id
                """).param("id",requestId).update();return get(requestId);}
}
