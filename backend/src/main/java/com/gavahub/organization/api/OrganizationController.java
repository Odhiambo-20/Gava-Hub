package com.gavahub.organization.api;

import com.gavahub.organization.application.OrganizationService;
import com.gavahub.organization.domain.OrganizationSummary;
import com.gavahub.organization.domain.OrganizationMemberSummary;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

@RestController
@RequestMapping("/api/v1/organizations")
public class OrganizationController {
    private final OrganizationService organizations;

    public OrganizationController(OrganizationService organizations) {
        this.organizations = organizations;
    }

    @GetMapping
    public List<OrganizationSummary> list(@RequestParam(required=false) UUID userId) {
        return userId == null ? organizations.listActive() : organizations.forUser(userId);
    }

    @GetMapping("/{id}")
    public OrganizationSummary get(@PathVariable UUID id) {
        return organizations.get(id);
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public OrganizationSummary create(@Valid @RequestBody Create request){
        return organizations.create(request.legalName(),request.tradingName(),request.organizationType(),request.registrationNumber());}
    @PutMapping("/{id}") public OrganizationSummary update(@PathVariable UUID id,@Valid @RequestBody Update request){
        return organizations.update(id,request.legalName(),request.tradingName(),request.status());}
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void close(@PathVariable UUID id){organizations.close(id);}
    @GetMapping("/{id}/members") public List<OrganizationMemberSummary> members(@PathVariable UUID id){return organizations.members(id);}
    @PostMapping("/{id}/members") public List<OrganizationMemberSummary> addMember(@PathVariable UUID id,@Valid @RequestBody Member request){return organizations.addMember(id,request.userId(),request.memberRole());}
    @DeleteMapping("/{id}/members/{userId}") @ResponseStatus(HttpStatus.NO_CONTENT) public void removeMember(@PathVariable UUID id,@PathVariable UUID userId){organizations.removeMember(id,userId);}
    public record Create(@NotBlank String legalName,String tradingName,@Pattern(regexp="EMPLOYER|INSTITUTION|GOVERNMENT|PLATFORM") String organizationType,String registrationNumber){}
    public record Update(@NotBlank String legalName,String tradingName,@Pattern(regexp="PENDING|ACTIVE|SUSPENDED|REJECTED|CLOSED") String status){}
    public record Member(@NotNull UUID userId,@Pattern(regexp="OWNER|ADMIN|VERIFIER|RECRUITER|FINANCE|AUDITOR|MEMBER") String memberRole){}
}
