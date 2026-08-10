package com.gavahub.document.infrastructure;

import java.io.IOException;
import java.io.InputStream;

public interface DocumentStorage {
    void store(String key, InputStream source) throws IOException;
    byte[] read(String key) throws IOException;
    void delete(String key) throws IOException;
}
