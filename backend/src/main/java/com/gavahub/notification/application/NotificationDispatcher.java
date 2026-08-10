package com.gavahub.notification.application;

import com.gavahub.notification.infrastructure.NotificationProperties;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class NotificationDispatcher {
    private final JdbcClient jdbc; private final JavaMailSender mail; private final RestClient rest;
    private final NotificationProperties properties;
    public NotificationDispatcher(JdbcClient jdbc, JavaMailSender mail, RestClient.Builder builder,
                                  NotificationProperties properties) {
        this.jdbc=jdbc; this.mail=mail; this.rest=builder.build(); this.properties=properties;
    }
    @Scheduled(fixedDelayString="${gava-hub.notifications.poll-delay:PT10S}")
    public void deliverPending() {
        jdbc.sql("""
                select id,channel,destination,template_code,template_data::text,attempt_count
                from gavahub.notification where status in ('PENDING','FAILED')
                and (next_attempt_at is null or next_attempt_at<=clock_timestamp())
                and attempt_count<:max order by created_at for update skip locked limit 20
                """).param("max", properties.maxAttempts()).query(Delivery.class).list().forEach(this::deliver);
    }
    private void deliver(Delivery delivery) {
        jdbc.sql("update gavahub.notification set status='PROCESSING',attempt_count=attempt_count+1 where id=:id")
                .param("id",delivery.id()).update();
        try {
            if ("EMAIL".equals(delivery.channel())) sendEmail(delivery);
            else if ("SMS".equals(delivery.channel())) sendSms(delivery);
            jdbc.sql("update gavahub.notification set status='SENT',sent_at=clock_timestamp(),last_error=null where id=:id")
                    .param("id",delivery.id()).update();
        } catch (RuntimeException exception) {
            long delay = Math.min(3600, 30L << Math.min(delivery.attemptCount(), 6));
            jdbc.sql("""
                    update gavahub.notification set status='FAILED',last_error=:error,
                    next_attempt_at=clock_timestamp() + (:delay || ' seconds')::interval where id=:id
                    """).param("error",safeMessage(exception)).param("delay",Long.toString(delay)).param("id",delivery.id()).update();
        }
    }
    private void sendEmail(Delivery delivery) {
        SimpleMailMessage message=new SimpleMailMessage(); message.setFrom(properties.fromEmail());
        message.setTo(delivery.destination()); message.setSubject(delivery.templateCode()); message.setText(delivery.templateData());
        mail.send(message);
    }
    private void sendSms(Delivery delivery) {
        if (properties.smsUrl()==null || properties.smsUrl().isBlank()) throw new IllegalStateException("SMS provider is not configured");
        rest.post().uri(properties.smsUrl()).headers(h -> h.setBearerAuth(properties.smsApiKey()))
                .body(Map.of("to",delivery.destination(),"message",delivery.templateData())).retrieve().toBodilessEntity();
    }
    private String safeMessage(Exception e) { String value=e.getMessage(); return value==null?e.getClass().getSimpleName():value.substring(0,Math.min(500,value.length())); }
    private record Delivery(UUID id,String channel,String destination,String templateCode,String templateData,int attemptCount) {}
}
