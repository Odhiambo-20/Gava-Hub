package com.gavahub.audit.api;

import com.gavahub.audit.application.AuditService;
import com.gavahub.audit.domain.AuditEventSummary;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/audit")
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {
    private final AuditService audit;
    public AuditController(AuditService audit){this.audit=audit;}
    @GetMapping public List<AuditEventSummary> recent(){return audit.recent();}
}
