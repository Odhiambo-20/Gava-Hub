package com.gavahub.shared.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.HttpMethod;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
    @Bean AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
    @Bean SecretKey jwtKey(JwtProperties properties) {
        return new SecretKeySpec(properties.jwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }
    @Bean JwtDecoder jwtDecoder(SecretKey key) {
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }
    @Bean JwtEncoder jwtEncoder(SecretKey key) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**", "/api/v1/contact", "/api/v1/webhooks/mpesa/**",
                                "/actuator/health/**", "/api-docs/**").permitAll()
                        .requestMatchers("/api/v1/organizations/*/members/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/verifications/*/decisions")
                            .hasAnyRole("ADMIN", "VERIFIER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/organizations/**", "/api/v1/invoices/**")
                            .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/organizations/**", "/api/v1/invoices/**")
                            .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/organizations/**", "/api/v1/invoices/**")
                            .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/credentials/**", "/api/v1/verifications/**")
                            .hasAnyRole("ADMIN", "VERIFIER")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/credentials/**", "/api/v1/verifications/**")
                            .hasAnyRole("ADMIN", "VERIFIER")
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(
                        new RolesJwtAuthenticationConverter())))
                .build();
    }
}
