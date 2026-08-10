package com.gavahub.document.infrastructure;

import com.gavahub.document.domain.DocumentSummary;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class DocumentQueryRepository {
    private final JdbcClient jdbc;
    public DocumentQueryRepository(JdbcClient jdbc) { this.jdbc = jdbc; }
    public Optional<DocumentSummary> findById(UUID id) {
        return jdbc.sql("""
                select id, owner_user_id, owner_organization_id, original_filename,
                       content_type, size_bytes, malware_scan_status, created_at
                from gavahub.document where id = :id and deleted_at is null
                """).param("id", id).query(DocumentSummary.class).optional();
    }
    public List<DocumentSummary> findAll(UUID ownerUserId, UUID ownerOrganizationId) {
        return jdbc.sql("""
                select id,owner_user_id,owner_organization_id,original_filename,content_type,size_bytes,
                       malware_scan_status,created_at from gavahub.document
                where deleted_at is null and (:userId is null or owner_user_id=:userId)
                  and (:organizationId is null or owner_organization_id=:organizationId)
                order by created_at desc
                """).param("userId",ownerUserId).param("organizationId",ownerOrganizationId)
                .query(DocumentSummary.class).list();
    }
}
