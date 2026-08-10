package com.gavahub.document.infrastructure;

import static org.assertj.core.api.Assertions.*;
import java.io.ByteArrayInputStream;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalDocumentStorageTests {
    @TempDir Path root;
    @Test void storesReadsAndDeletesDocuments() throws Exception {
        LocalDocumentStorage storage = new LocalDocumentStorage(new DocumentStorageProperties("LOCAL","test",root));
        storage.store("owner/file.txt",new ByteArrayInputStream("content".getBytes()));
        assertThat(storage.read("owner/file.txt")).isEqualTo("content".getBytes());
        storage.delete("owner/file.txt");
        assertThatThrownBy(() -> storage.read("owner/file.txt")).isInstanceOf(java.io.IOException.class);
    }
    @Test void preventsPathTraversal() {
        LocalDocumentStorage storage = new LocalDocumentStorage(new DocumentStorageProperties("LOCAL","test",root));
        assertThatIllegalArgumentException().isThrownBy(() -> storage.read("../secret"));
    }
}
