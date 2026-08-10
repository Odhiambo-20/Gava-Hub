package com.gavahub.verification.api;

import com.gavahub.verification.application.VerificationService;
import com.gavahub.verification.domain.VerificationSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/verifications")
public class VerificationController {
    private final VerificationService verifications;
    public VerificationController(VerificationService verifications) { this.verifications = verifications; }
    @GetMapping("/{id}") public VerificationSummary get(@PathVariable UUID id) { return verifications.get(id); }
    @GetMapping public List<VerificationSummary> list() { return verifications.list(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public VerificationSummary create(@Valid @RequestBody Create request) {
        return verifications.create(request.requestedByUserId(), request.requestingOrganizationId(),
                request.candidateId(), request.consentId(), request.purpose());
    }
    @PutMapping("/{id}") public VerificationSummary update(@PathVariable UUID id, @Valid @RequestBody Update request) {
        return verifications.update(id, request.purpose(), request.status());
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable UUID id) { verifications.cancel(id); }
    @PostMapping("/{id}/decisions")
    public VerificationSummary decide(@PathVariable UUID id,@Valid @RequestBody Decision request){
        return verifications.decide(id,request.credentialId(),request.decidedByUserId(),request.assignedOrganizationId(),request.decision(),request.notes());}
    public record Create(@NotNull UUID requestedByUserId, UUID requestingOrganizationId,
                         @NotNull UUID candidateId, UUID consentId, @NotBlank String purpose) {}
    public record Update(@NotBlank String purpose,
                         @Pattern(regexp="DRAFT|AWAITING_PAYMENT|SUBMITTED|IN_REVIEW|COMPLETED|REJECTED|CANCELLED|EXPIRED") String status) {}
    public record Decision(@NotNull UUID credentialId,@NotNull UUID decidedByUserId,UUID assignedOrganizationId,
                           @Pattern(regexp="VERIFIED|REJECTED|MORE_INFORMATION_REQUIRED") String decision,String notes){}
}
