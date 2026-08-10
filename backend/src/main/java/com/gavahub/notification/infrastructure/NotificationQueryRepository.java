package com.gavahub.notification.infrastructure;

import com.gavahub.notification.domain.NotificationSummary;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class NotificationQueryRepository {
    private final JdbcClient jdbc;
    public NotificationQueryRepository(JdbcClient jdbc) { this.jdbc = jdbc; }
    public List<NotificationSummary> findByRecipient(UUID userId) {
        return jdbc.sql("""
                select id, recipient_user_id, channel, template_code, status, attempt_count, sent_at, created_at
                from gavahub.notification where recipient_user_id = :userId order by created_at desc limit 100
                """).param("userId", userId).query(NotificationSummary.class).list();
    }
    public Optional<NotificationSummary> findById(UUID id) {
        return jdbc.sql("""
                select id,recipient_user_id,channel,template_code,status,attempt_count,sent_at,created_at
                from gavahub.notification where id=:id
                """).param("id",id).query(NotificationSummary.class).optional();
    }
}
