package com.gavahub.document.infrastructure;

import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("gava-hub.documents")
public record DocumentStorageProperties(String provider, String bucket, Path localRoot) {
    public DocumentStorageProperties {
        provider = provider == null || provider.isBlank() ? "LOCAL" : provider.toUpperCase();
        bucket = bucket == null || bucket.isBlank() ? "gava-hub-local" : bucket;
        localRoot = localRoot == null ? Path.of("./data/documents") : localRoot;
    }
}
