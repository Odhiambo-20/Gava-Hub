package com.gavahub.contact.api;

import com.gavahub.contact.application.ContactService;
import com.gavahub.contact.domain.ContactModels.ContactResponse;
import com.gavahub.contact.domain.ContactModels.SubmitContactRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/contact")
public class ContactController {
    private final ContactService contacts;
    public ContactController(ContactService contacts) { this.contacts = contacts; }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ContactResponse submit(@Valid @RequestBody SubmitContactRequest request) {
        return contacts.submit(request);
    }
}
