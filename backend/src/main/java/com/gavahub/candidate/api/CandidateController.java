package com.gavahub.candidate.api;

import com.gavahub.candidate.application.CandidateService;
import com.gavahub.candidate.domain.CandidateSummary;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/candidates")
public class CandidateController {
    private final CandidateService candidates;

    public CandidateController(CandidateService candidates) {
        this.candidates = candidates;
    }

    @GetMapping("/{id}")
    public CandidateSummary get(@PathVariable UUID id) {
        return candidates.get(id);
    }
    @GetMapping public List<CandidateSummary> list(@RequestParam(required=false) UUID userId){
        return userId == null ? candidates.list() : candidates.forUser(userId);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public CandidateSummary create(@Valid @RequestBody Create r){return candidates.create(r.userId(),r.givenName(),r.familyName(),r.dateOfBirth(),r.headline());}
    @PutMapping("/{id}") public CandidateSummary update(@PathVariable UUID id,@Valid @RequestBody Update r){return candidates.update(id,r.givenName(),r.familyName(),r.dateOfBirth(),r.headline(),r.profileStatus());}
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void archive(@PathVariable UUID id){candidates.archive(id);}
    public record Create(@NotNull UUID userId,@NotBlank String givenName,@NotBlank String familyName,@Past LocalDate dateOfBirth,String headline){}
    public record Update(@NotBlank String givenName,@NotBlank String familyName,@Past LocalDate dateOfBirth,String headline,@Pattern(regexp="DRAFT|ACTIVE|SUSPENDED|ARCHIVED") String profileStatus){}
}
