package com.gavahub.payment.application;

import com.gavahub.payment.domain.PaymentProvider;
import com.gavahub.payment.domain.PaymentRepository;
import com.gavahub.payment.infrastructure.PaymentSettings;
import com.gavahub.shared.exception.ConflictException;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.simple.JdbcClient;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class PaymentMethodTests {
    @Test
    void coopModeRejectsStkBeforeCallingProviderOrWritingPayment() {
        var repository = mock(PaymentRepository.class);
        var provider = mock(PaymentProvider.class);
        var jdbc = mock(JdbcClient.class);
        var events = mock(ApplicationEventPublisher.class);
        var settings = new PaymentSettings(PaymentSettings.Method.COOP_PAYBILL, "400200", "1195351");
        var service = new PaymentService(repository, provider, jdbc, events, settings);

        assertThatThrownBy(() -> service.initiate(UUID.randomUUID(), UUID.randomUUID(),
                "0712345678", "test-key"))
                .isInstanceOf(ConflictException.class);
        verifyNoInteractions(repository, provider, jdbc, events);
    }
}
