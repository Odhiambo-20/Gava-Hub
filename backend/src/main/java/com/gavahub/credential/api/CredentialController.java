package com.gavahub.credential.api;

import com.gavahub.credential.application.CredentialService;
import com.gavahub.credential.domain.CredentialSummary;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/credentials")
public class CredentialController {
    private final CredentialService credentials;
    public CredentialController(CredentialService credentials) { this.credentials = credentials; }
    @GetMapping("/{id}") public CredentialSummary get(@PathVariable UUID id) { return credentials.get(id); }
    @GetMapping public List<CredentialSummary> byCandidate(@RequestParam UUID candidateId) {
        return credentials.forCandidate(candidateId);
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public CredentialSummary create(@Valid @RequestBody Create r){return credentials.create(r.candidateId(),r.issuingOrganizationId(),r.documentId(),r.credentialType(),r.title(),r.credentialNumber(),r.issuedOn(),r.expiresOn());}
    @PutMapping("/{id}") public CredentialSummary update(@PathVariable UUID id,@Valid @RequestBody Update r){return credentials.update(id,r.title(),r.credentialNumber(),r.issuedOn(),r.expiresOn(),r.status());}
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void revoke(@PathVariable UUID id){credentials.revoke(id);}
    public record Create(@NotNull UUID candidateId,UUID issuingOrganizationId,UUID documentId,@NotBlank String credentialType,@NotBlank String title,String credentialNumber,LocalDate issuedOn,LocalDate expiresOn){}
    public record Update(@NotBlank String title,String credentialNumber,LocalDate issuedOn,LocalDate expiresOn,@Pattern(regexp="UNVERIFIED|PENDING|VERIFIED|REJECTED|EXPIRED|REVOKED") String status){}
}
