package com.gavahub.administration.domain;

import java.time.Instant;

public record SystemStatus(String service, String status, Instant time) {}
