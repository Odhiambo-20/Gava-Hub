package com.gavahub.document.api;

import com.gavahub.document.application.DocumentService;
import com.gavahub.document.domain.DocumentSummary;
import java.util.UUID;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {
    private final DocumentService documents;
    public DocumentController(DocumentService documents) { this.documents = documents; }
    @GetMapping("/{id}") public DocumentSummary get(@PathVariable UUID id) { return documents.get(id); }
    @GetMapping public List<DocumentSummary> list(@RequestParam(required=false) UUID ownerUserId,
                                                  @RequestParam(required=false) UUID ownerOrganizationId) {
        return documents.list(ownerUserId, ownerOrganizationId);
    }
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED)
    public DocumentSummary upload(@RequestParam(required=false) UUID ownerUserId,
                                  @RequestParam(required=false) UUID ownerOrganizationId,
                                  @RequestPart MultipartFile file) {
        return documents.upload(ownerUserId, ownerOrganizationId, file);
    }
    @GetMapping("/{id}/content") public ResponseEntity<byte[]> download(@PathVariable UUID id) {
        var file = documents.download(id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(file.filename()).build().toString()).body(file.content());
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { documents.delete(id); }
}
