package com.gavahub.audit.application;

import com.gavahub.audit.domain.AuditEvent;
import com.gavahub.audit.infrastructure.AuditEventRepository;
import com.gavahub.audit.domain.AuditEventSummary;
import java.util.List;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {
    private final AuditEventRepository events;
    public AuditService(AuditEventRepository events) { this.events = events; }
    @Transactional
    public void record(UUID actor, String action, String resourceType, String resourceId, String outcome) {
        events.append(new AuditEvent(actor, null, action, resourceType, resourceId, outcome, null, "{}", Instant.now()));
    }
    @Transactional(readOnly=true) public List<AuditEventSummary> recent(){return events.findRecent();}
}
