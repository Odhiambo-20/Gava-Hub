package com.gavahub.identity.api;

import com.gavahub.identity.application.AuthService;
import com.gavahub.identity.domain.AuthModels.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse register(@Valid @RequestBody RegisterRequest request) { return auth.register(request); }
    @PostMapping("/login") public TokenResponse login(@Valid @RequestBody LoginRequest request) { return auth.login(request); }
}
