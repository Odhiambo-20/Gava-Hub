package com.gavahub.audit.infrastructure;

import com.gavahub.audit.domain.AuditEvent;
import com.gavahub.audit.domain.AuditEventSummary;
import java.sql.Timestamp;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AuditEventRepository {
    private final JdbcClient jdbc;
    public AuditEventRepository(JdbcClient jdbc) { this.jdbc = jdbc; }
    public void append(AuditEvent event) {
        jdbc.sql("""
                insert into gavahub.audit_event
                    (actor_user_id, actor_organization_id, action, resource_type, resource_id,
                     outcome, request_id, event_data, occurred_at)
                values (:actorUserId, :actorOrganizationId, :action, :resourceType, :resourceId,
                        :outcome, :requestId, cast(:eventData as jsonb), :occurredAt)
                """)
                .param("actorUserId", event.actorUserId())
                .param("actorOrganizationId", event.actorOrganizationId())
                .param("action", event.action())
                .param("resourceType", event.resourceType())
                .param("resourceId", event.resourceId())
                .param("outcome", event.outcome())
                .param("requestId", event.requestId())
                .param("eventData", event.eventData())
                .param("occurredAt", Timestamp.from(event.occurredAt()))
                .update();
    }
    public List<AuditEventSummary> findRecent() {
        return jdbc.sql("""
                select id,actor_user_id,action,resource_type,resource_id,outcome,request_id,occurred_at
                from gavahub.audit_event order by occurred_at desc limit 200
                """).query(AuditEventSummary.class).list();
    }
}
