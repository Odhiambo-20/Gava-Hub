package com.gavahub.administration.application;

import com.gavahub.administration.domain.SystemStatus;
import com.gavahub.administration.infrastructure.DatabaseStatusProbe;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class SystemStatusService {
    private final DatabaseStatusProbe database;
    public SystemStatusService(DatabaseStatusProbe database) { this.database = database; }
    public SystemStatus status() {
        return new SystemStatus("gava-hub-backend", database.isAvailable() ? "UP" : "DOWN", Instant.now());
    }
}
