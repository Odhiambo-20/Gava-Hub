package com.gavahub.shared.validation;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;

class PhoneNumbersTests {
    @ParameterizedTest @ValueSource(strings={"0712 345 678","+254712345678","712345678"})
    void normalizesKenyanMobileNumbers(String value) {
        assertThat(PhoneNumbers.normalizeKenyan(value)).isEqualTo("254712345678");
    }
    @Test void rejectsInvalidNumbers() {
        assertThatIllegalArgumentException().isThrownBy(() -> PhoneNumbers.normalizeKenyan("123"));
    }
}
