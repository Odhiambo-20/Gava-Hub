package com.gavahub.document.application;

import com.gavahub.document.domain.DocumentSummary;
import com.gavahub.document.infrastructure.DocumentQueryRepository;
import com.gavahub.document.infrastructure.DocumentStorage;
import com.gavahub.document.infrastructure.DocumentStorageProperties;
import com.gavahub.shared.exception.ResourceNotFoundException;
import java.io.IOException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.UUID;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentService {
    private final DocumentQueryRepository documents;
    private final DocumentStorage storage; private final DocumentStorageProperties properties; private final JdbcClient jdbc;
    public DocumentService(DocumentQueryRepository documents, DocumentStorage storage,
                           DocumentStorageProperties properties, JdbcClient jdbc) {
        this.documents = documents; this.storage = storage; this.properties = properties; this.jdbc = jdbc;
    }
    @Transactional(readOnly = true)
    public DocumentSummary get(UUID id) {
        return documents.findById(id).orElseThrow(() -> new ResourceNotFoundException("Document not found"));
    }
    @Transactional(readOnly = true)
    public List<DocumentSummary> list(UUID ownerUserId, UUID ownerOrganizationId) {
        return documents.findAll(ownerUserId, ownerOrganizationId);
    }
    @Transactional public DocumentSummary upload(UUID ownerUserId, UUID ownerOrganizationId, MultipartFile file) {
        if (ownerUserId == null && ownerOrganizationId == null) throw new IllegalArgumentException("A document owner is required");
        if (file.isEmpty()) throw new IllegalArgumentException("The uploaded file is empty");
        String original = file.getOriginalFilename() == null ? "document" : PathSanitizer.filename(file.getOriginalFilename());
        String type = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        UUID id = UUID.randomUUID(); String key = id + "/" + original;
        try {
            byte[] bytes = file.getBytes();
            String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
            storage.store(key, new java.io.ByteArrayInputStream(bytes));
            jdbc.sql("""
                    insert into gavahub.document(id,owner_user_id,owner_organization_id,storage_provider,storage_bucket,
                    storage_key,original_filename,content_type,size_bytes,sha256_hash,malware_scan_status)
                    values(:id,:userId,:orgId,:provider,:bucket,:key,:name,:type,:size,:hash,'PENDING')
                    """).param("id", id).param("userId", ownerUserId).param("orgId", ownerOrganizationId)
                    .param("provider", properties.provider()).param("bucket", properties.bucket()).param("key", key)
                    .param("name", original).param("type", type).param("size", bytes.length).param("hash", hash).update();
            return get(id);
        } catch (Exception exception) { try { storage.delete(key); } catch (IOException ignored) {}
            throw new IllegalStateException("Document upload failed", exception); }
    }
    @Transactional(readOnly = true) public Download download(UUID id) {
        DocumentSummary summary = get(id);
        String key = jdbc.sql("select storage_key from gavahub.document where id=:id and deleted_at is null")
                .param("id", id).query(String.class).single();
        try { return new Download(summary.originalFilename(), summary.contentType(), storage.read(key)); }
        catch (IOException exception) { throw new IllegalStateException("Stored document is unavailable", exception); }
    }
    @Transactional public void delete(UUID id) {
        get(id); String key = jdbc.sql("select storage_key from gavahub.document where id=:id")
                .param("id", id).query(String.class).single();
        jdbc.sql("update gavahub.document set deleted_at=clock_timestamp() where id=:id").param("id", id).update();
        try { storage.delete(key); } catch (IOException exception) { throw new IllegalStateException("Document deletion failed", exception); }
    }
    public record Download(String filename, String contentType, byte[] content) {}
    private static final class PathSanitizer {
        static String filename(String value) { String cleaned = java.nio.file.Path.of(value).getFileName().toString()
                .replaceAll("[^A-Za-z0-9._-]", "_"); return cleaned.isBlank() ? "document" : cleaned; }
    }
}
