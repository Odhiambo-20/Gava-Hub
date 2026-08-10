package com.gavahub.billing.api;

import com.gavahub.billing.application.InvoiceService;
import com.gavahub.billing.domain.InvoiceSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {
    private final InvoiceService invoices;
    public InvoiceController(InvoiceService invoices) { this.invoices = invoices; }
    @GetMapping("/{id}") public InvoiceSummary get(@PathVariable UUID id) { return invoices.get(id); }
    @GetMapping public List<InvoiceSummary> list(@RequestParam(required=false) UUID userId) {
        return userId == null ? invoices.list() : invoices.forUser(userId); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public InvoiceSummary create(@Valid @RequestBody Create request) {
        return invoices.create(request.billedUserId(),request.billedOrganizationId(),request.verificationRequestId(),
                request.subtotal(),request.tax(),request.currency(),request.dueAt());
    }
    @PutMapping("/{id}") public InvoiceSummary update(@PathVariable UUID id,@Valid @RequestBody Update request) {
        return invoices.update(id,request.dueAt(),request.status());
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void voidInvoice(@PathVariable UUID id){invoices.voidInvoice(id);}
    public record Create(UUID billedUserId,UUID billedOrganizationId,UUID verificationRequestId,
                         @NotNull @DecimalMin("0.00") BigDecimal subtotal,@DecimalMin("0.00") BigDecimal tax,
                         @NotBlank @Pattern(regexp="[A-Z]{3}") String currency,Instant dueAt) {}
    public record Update(Instant dueAt,@Pattern(regexp="DRAFT|OPEN|PAID|VOID|OVERDUE|REFUNDED") String status) {}
}
