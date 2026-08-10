package com.gavahub.notification.application;

import com.gavahub.notification.domain.NotificationSummary;
import com.gavahub.notification.infrastructure.NotificationQueryRepository;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
    private final NotificationQueryRepository notifications;
    private final JdbcClient jdbc;
    public NotificationService(NotificationQueryRepository notifications, JdbcClient jdbc) { this.notifications = notifications; this.jdbc=jdbc; }
    @Transactional(readOnly = true)
    public List<NotificationSummary> forUser(UUID userId) { return notifications.findByRecipient(userId); }
    @Transactional public NotificationSummary create(UUID userId,String channel,String destination,String template,Map<String,Object> data) {
        UUID id=UUID.randomUUID();
        jdbc.sql("""
                insert into gavahub.notification(id,recipient_user_id,channel,destination,template_code,template_data)
                values(:id,:userId,:channel,:destination,:template,cast(:data as jsonb))
                """).param("id",id).param("userId",userId).param("channel",channel.toUpperCase())
                .param("destination",destination).param("template",template).param("data",toJson(data)).update();
        return notifications.findById(id).orElseThrow();
    }
    @Transactional public void cancel(UUID id) {
        int changed=jdbc.sql("update gavahub.notification set status='CANCELLED' where id=:id and status in ('PENDING','FAILED')")
                .param("id",id).update(); if(changed==0) throw new com.gavahub.shared.exception.ConflictException("Notification cannot be cancelled");
    }
    private String toJson(Map<String,Object> data) { try { return new tools.jackson.databind.ObjectMapper().writeValueAsString(data); }
        catch(Exception e){ throw new IllegalArgumentException("Invalid template data",e); } }
}
