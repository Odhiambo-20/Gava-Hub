package com.gavahub.identity.api;

import com.gavahub.identity.application.UserService;
import com.gavahub.identity.domain.UserSummary;
import java.util.UUID;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService users;

    public UserController(UserService users) {
        this.users = users;
    }

    @GetMapping("/{id}")
    public UserSummary get(@PathVariable UUID id) {
        return users.get(id);
    }

    @GetMapping @PreAuthorize("hasRole('ADMIN')")
    public List<UserSummary> list() { return users.list(); }

    @PutMapping("/{id}") @PreAuthorize("#id.toString() == authentication.name or hasRole('ADMIN')")
    public UserSummary update(@PathVariable UUID id, @Valid @RequestBody UpdateUser request) {
        return users.update(id, request.displayName(), request.status());
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')")
    public void disable(@PathVariable UUID id) { users.disable(id); }

    @PostMapping("/{id}/roles") @PreAuthorize("hasRole('ADMIN')")
    public UserSummary grantRole(@PathVariable UUID id, @Valid @RequestBody GrantRole request) {
        return users.grantRole(id, request.role());
    }
    @GetMapping("/{id}/roles") @PreAuthorize("#id.toString() == authentication.name or hasRole('ADMIN')")
    public List<String> roles(@PathVariable UUID id){return users.roles(id);}
    @DeleteMapping("/{id}/roles/{role}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')")
    public void revokeRole(@PathVariable UUID id,@PathVariable String role){users.revokeRole(id,role);}

    public record UpdateUser(@NotBlank String displayName,
                             @Pattern(regexp = "PENDING|ACTIVE|SUSPENDED|DISABLED") String status) {}
    public record GrantRole(@Pattern(regexp = "ROLE_USER|ROLE_ADMIN|ROLE_VERIFIER") String role) {}
}
