package com.gavahub.credential.application;

import com.gavahub.credential.domain.CredentialSummary;
import com.gavahub.credential.infrastructure.CredentialQueryRepository;
import com.gavahub.shared.exception.ResourceNotFoundException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.simple.JdbcClient;
import java.time.LocalDate;

@Service
public class CredentialService {
    private final CredentialQueryRepository credentials;
    private final JdbcClient jdbc;
    public CredentialService(CredentialQueryRepository credentials,JdbcClient jdbc) { this.credentials = credentials; this.jdbc=jdbc; }

    @Transactional(readOnly = true)
    public CredentialSummary get(UUID id) {
        return credentials.findById(id).orElseThrow(() -> new ResourceNotFoundException("Credential not found"));
    }

    @Transactional(readOnly = true)
    public List<CredentialSummary> forCandidate(UUID candidateId) { return credentials.findByCandidate(candidateId); }
    @Transactional public CredentialSummary create(UUID candidateId,UUID issuerId,UUID documentId,String type,String title,String number,LocalDate issued,LocalDate expires){
        UUID id=UUID.randomUUID();jdbc.sql("""
                insert into gavahub.credential(id,candidate_id,issuing_organization_id,document_id,credential_type,title,credential_number,issued_on,expires_on)
                values(:id,:candidate,:issuer,:document,:type,:title,:number,:issued,:expires)
                """).param("id",id).param("candidate",candidateId).param("issuer",issuerId).param("document",documentId)
                .param("type",type).param("title",title).param("number",number).param("issued",issued).param("expires",expires).update();return get(id);}
    @Transactional public CredentialSummary update(UUID id,String title,String number,LocalDate issued,LocalDate expires,String status){
        get(id);jdbc.sql("update gavahub.credential set title=:title,credential_number=:number,issued_on=:issued,expires_on=:expires,status=:status where id=:id")
                .param("title",title).param("number",number).param("issued",issued).param("expires",expires).param("status",status).param("id",id).update();return get(id);}
    @Transactional public void revoke(UUID id){get(id);jdbc.sql("update gavahub.credential set status='REVOKED' where id=:id").param("id",id).update();}
}
