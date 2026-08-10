package com.gavahub.administration.api;

import com.gavahub.administration.application.SystemStatusService;
import com.gavahub.administration.domain.SystemStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemController {
    private final SystemStatusService system;
    public SystemController(SystemStatusService system) { this.system = system; }
    @GetMapping("/status") public SystemStatus status() { return system.status(); }
}
