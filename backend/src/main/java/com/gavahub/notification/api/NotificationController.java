package com.gavahub.notification.api;

import com.gavahub.notification.application.NotificationService;
import com.gavahub.notification.domain.NotificationSummary;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService notifications;
    public NotificationController(NotificationService notifications) { this.notifications = notifications; }
    @GetMapping public List<NotificationSummary> list(@RequestParam UUID userId) {
        return notifications.forUser(userId);
    }
    @PostMapping @ResponseStatus(HttpStatus.ACCEPTED)
    public NotificationSummary create(@Valid @RequestBody CreateNotification request) {
        return notifications.create(request.userId(),request.channel(),request.destination(),request.templateCode(),request.data());
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable UUID id){notifications.cancel(id);}
    public record CreateNotification(@NotNull UUID userId,@Pattern(regexp="EMAIL|SMS|IN_APP") String channel,
                                     @NotBlank String destination,@NotBlank String templateCode,Map<String,Object> data) {}
}
