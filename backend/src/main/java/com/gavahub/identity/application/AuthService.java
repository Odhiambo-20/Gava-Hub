package com.gavahub.identity.application;

import com.gavahub.identity.domain.AuthModels.*;
import com.gavahub.shared.exception.ConflictException;
import com.gavahub.shared.security.JwtProperties;
import com.gavahub.shared.validation.PhoneNumbers;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.gavahub.audit.application.AuditService;

@Service
public class AuthService {
    private final JdbcClient jdbc; private final PasswordEncoder passwords;
    private final JwtEncoder tokens; private final JwtProperties properties;
    private final AuditService audit;
    public AuthService(JdbcClient jdbc, PasswordEncoder passwords, JwtEncoder tokens, JwtProperties properties, AuditService audit) {
        this.jdbc = jdbc; this.passwords = passwords; this.tokens = tokens; this.properties = properties; this.audit = audit;
    }
    @Transactional public TokenResponse register(RegisterRequest request) {
        if (jdbc.sql("select count(*) from gavahub.app_user where email=:email")
                .param("email", request.email()).query(Integer.class).single() > 0) {
            throw new ConflictException("An account already exists for this email");
        }
        UUID id = UUID.randomUUID();
        String phone = request.phoneNumber() == null || request.phoneNumber().isBlank()
                ? null : PhoneNumbers.normalizeKenyan(request.phoneNumber());
        jdbc.sql("""
                insert into gavahub.app_user(id,email,phone_e164,display_name,status,password_hash)
                values(:id,:email,:phone,:name,'ACTIVE',:password)
                """).param("id", id).param("email", request.email().trim().toLowerCase())
                .param("phone", phone).param("name", request.displayName().trim())
                .param("password", passwords.encode(request.password())).update();
        jdbc.sql("""
                insert into gavahub.user_role(user_id,role_id)
                select :id,id from gavahub.role where code='ROLE_USER'
                """).param("id", id).update();
        createInitialProfile(id, request);
        audit.record(id,"USER_REGISTERED","USER",id.toString(),"SUCCESS");
        return issue(id, request.email(), List.of("ROLE_USER"));
    }
    private void createInitialProfile(UUID userId, RegisterRequest request) {
        String type = request.accountType() == null ? "CANDIDATE" : request.accountType();
        if ("CANDIDATE".equals(type)) {
            String[] names = request.displayName().trim().split("\\s+", 2);
            jdbc.sql("""
                    insert into gavahub.candidate_profile(user_id,given_name,family_name,profile_status)
                    values(:userId,:given,:family,'DRAFT')
                    """).param("userId", userId).param("given", names[0])
                    .param("family", names.length > 1 ? names[1] : names[0]).update();
            return;
        }
        UUID organizationId = UUID.randomUUID();
        jdbc.sql("""
                insert into gavahub.organization(id,legal_name,organization_type,status)
                values(:id,:name,:type,'PENDING')
                """).param("id", organizationId).param("name", request.displayName().trim())
                .param("type", type).update();
        jdbc.sql("""
                insert into gavahub.organization_member(organization_id,user_id,member_role,status,joined_at)
                values(:organizationId,:userId,'OWNER','ACTIVE',clock_timestamp())
                """).param("organizationId", organizationId).param("userId", userId).update();
    }
    @Transactional public TokenResponse login(LoginRequest request) {
        Account account = jdbc.sql("""
                select id,email::text,password_hash,status from gavahub.app_user where email=:email
                """).param("email", request.email().trim().toLowerCase()).query(Account.class).optional()
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!"ACTIVE".equals(account.status()) || account.passwordHash() == null
                || !passwords.matches(request.password(), account.passwordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        List<String> roles = jdbc.sql("""
                select r.code from gavahub.role r join gavahub.user_role ur on ur.role_id=r.id
                where ur.user_id=:id order by r.code
                """).param("id", account.id()).query(String.class).list();
        jdbc.sql("update gavahub.app_user set last_login_at=clock_timestamp() where id=:id")
                .param("id", account.id()).update();
        audit.record(account.id(),"USER_LOGIN","USER",account.id().toString(),"SUCCESS");
        return issue(account.id(), account.email(), roles);
    }
    private TokenResponse issue(UUID id, String email, List<String> roles) {
        Instant now = Instant.now(), expires = now.plus(properties.tokenTtl());
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer(properties.issuer()).issuedAt(now).expiresAt(expires)
                .subject(id.toString()).audience(List.of(properties.audience())).claim("email", email)
                .claim("roles", roles).build();
        String token = tokens.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new TokenResponse(token, "Bearer", expires, id, roles);
    }
    private record Account(UUID id, String email, String passwordHash, String status) {}
}
