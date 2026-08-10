package com.gavahub;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import com.gavahub.contact.application.ContactService;
import com.gavahub.contact.domain.ContactModels.SubmitContactRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import static org.assertj.core.api.Assertions.assertThat;
import com.gavahub.identity.application.AuthService;
import com.gavahub.identity.domain.AuthModels.RegisterRequest;

@Testcontainers
@ActiveProfiles("test")
@SpringBootTest(classes = GavaHubApplication.class)
class GavaHubApplicationTests {

    @Autowired ContactService contacts;
    @Autowired JdbcClient jdbc;
    @Autowired AuthService auth;

    @Container
    @ServiceConnection
    static final PostgreSQLContainer postgres =
            new PostgreSQLContainer("postgres:17-alpine")
                    .withDatabaseName("gavahub_test")
                    .withUsername("gavahub")
                    .withPassword("gavahub-test-only");

    @Test
    void contextLoadsAndMigrationsApply() {
        // Context startup proves that the application configuration is valid and
        // that every Flyway migration applies to a clean PostgreSQL database.
    }

    @Test
    void contactEnquiryIsPersistedAndSupportEmailIsQueued() {
        var response = contacts.submit(new SubmitContactRequest(
                "Amina Wanjiru", "amina@example.com", "+254712345678", "CANDIDATE",
                "I need help verifying an academic certificate."));
        assertThat(response.referenceNumber()).startsWith("GH-CON-");
        assertThat(jdbc.sql("select count(*) from gavahub.contact_enquiry where id=:id")
                .param("id", response.id()).query(Integer.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("select count(*) from gavahub.notification where template_code='CONTACT_ENQUIRY'")
                .query(Integer.class).single()).isEqualTo(1);
    }

    @Test
    void registrationCreatesTheSelectedAccountProfile() {
        var candidate = auth.register(new RegisterRequest("candidate@example.com", "StrongPass123!",
                "Amina Wanjiru", "+254712345678", "CANDIDATE"));
        assertThat(jdbc.sql("select count(*) from gavahub.candidate_profile where user_id=:id")
                .param("id",candidate.userId()).query(Integer.class).single()).isEqualTo(1);

        var employer = auth.register(new RegisterRequest("employer@example.com", "StrongPass123!",
                "Acme Industries", null, "EMPLOYER"));
        assertThat(jdbc.sql("""
                select count(*) from gavahub.organization_member m join gavahub.organization o on o.id=m.organization_id
                where m.user_id=:id and m.member_role='OWNER' and o.organization_type='EMPLOYER'
                """).param("id",employer.userId()).query(Integer.class).single()).isEqualTo(1);
    }
}
