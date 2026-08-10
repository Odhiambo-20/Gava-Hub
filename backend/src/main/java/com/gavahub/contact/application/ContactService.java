package com.gavahub.contact.application;

import com.gavahub.contact.domain.ContactModels.ContactResponse;
import com.gavahub.contact.domain.ContactModels.SubmitContactRequest;
import com.gavahub.contact.infrastructure.ContactProperties;
import com.gavahub.shared.validation.PhoneNumbers;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import com.gavahub.audit.application.AuditService;

@Service
public class ContactService {
    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private final ContactProperties properties;
    private final AuditService audit;

    public ContactService(JdbcClient jdbc, ObjectMapper json, ContactProperties properties, AuditService audit) {
        this.jdbc = jdbc; this.json = json; this.properties = properties; this.audit = audit;
    }

    @Transactional
    public ContactResponse submit(SubmitContactRequest request) {
        UUID id = UUID.randomUUID();
        String reference = "GH-CON-" + id.toString().substring(0, 8).toUpperCase();
        String phone = request.phoneNumber() == null || request.phoneNumber().isBlank()
                ? null : PhoneNumbers.normalizeKenyan(request.phoneNumber());
        jdbc.sql("""
                insert into gavahub.contact_enquiry
                (id,reference_number,full_name,email,phone_e164,requester_type,message)
                values(:id,:reference,:name,:email,:phone,:type,:message)
                """).param("id", id).param("reference", reference).param("name", request.fullName().trim())
                .param("email", request.email().trim().toLowerCase()).param("phone", phone)
                .param("type", request.requesterType()).param("message", request.message().trim()).update();

        jdbc.sql("""
                insert into gavahub.notification(channel,template_code,destination,template_data)
                values('EMAIL','CONTACT_ENQUIRY',:destination,cast(:data as jsonb))
                """).param("destination", properties.supportEmail()).param("data", toJson(Map.of(
                        "reference", reference, "name", request.fullName().trim(),
                        "email", request.email().trim().toLowerCase(), "requesterType", request.requesterType(),
                        "message", request.message().trim()))).update();
        audit.record(null,"CONTACT_ENQUIRY_SUBMITTED","CONTACT_ENQUIRY",id.toString(),"SUCCESS");
        return new ContactResponse(id, reference, "NEW", Instant.now());
    }

    private String toJson(Map<String, Object> value) {
        try { return json.writeValueAsString(value); }
        catch (Exception exception) { throw new IllegalArgumentException("Invalid contact enquiry", exception); }
    }
}
