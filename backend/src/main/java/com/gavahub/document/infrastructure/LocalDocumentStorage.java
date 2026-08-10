package com.gavahub.document.infrastructure;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import org.springframework.stereotype.Component;

@Component
public class LocalDocumentStorage implements DocumentStorage {
    private final Path root;
    public LocalDocumentStorage(DocumentStorageProperties properties) {
        root = properties.localRoot().toAbsolutePath().normalize();
    }
    @Override public void store(String key, InputStream source) throws IOException {
        Path target = resolve(key); Files.createDirectories(target.getParent());
        Path temporary = Files.createTempFile(target.getParent(), "upload-", ".tmp");
        try { Files.copy(source, temporary, StandardCopyOption.REPLACE_EXISTING);
            Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } finally { Files.deleteIfExists(temporary); }
    }
    @Override public byte[] read(String key) throws IOException { return Files.readAllBytes(resolve(key)); }
    @Override public void delete(String key) throws IOException { Files.deleteIfExists(resolve(key)); }
    private Path resolve(String key) {
        Path resolved = root.resolve(key).normalize();
        if (!resolved.startsWith(root)) throw new IllegalArgumentException("Invalid document key");
        return resolved;
    }
}
