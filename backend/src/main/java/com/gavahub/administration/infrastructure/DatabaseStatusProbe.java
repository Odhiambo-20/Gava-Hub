package com.gavahub.administration.infrastructure;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
public class DatabaseStatusProbe {
    private final JdbcClient jdbc;
    public DatabaseStatusProbe(JdbcClient jdbc) { this.jdbc = jdbc; }
    public boolean isAvailable() { return Boolean.TRUE.equals(jdbc.sql("select true").query(Boolean.class).single()); }
}
