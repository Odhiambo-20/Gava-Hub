package com.gavahub.identity.infrastructure;

import com.gavahub.identity.domain.UserSummary;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UserQueryRepository {
    private final JdbcClient jdbc;

    public UserQueryRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UserSummary> findById(UUID id) {
        return jdbc.sql("""
                        select id, email::text, display_name, status, created_at
                        from gavahub.app_user where id = :id
                        """)
                .param("id", id)
                .query(UserSummary.class)
                .optional();
    }

    public List<UserSummary> findAll() {
        return jdbc.sql("""
                select id, email::text, display_name, status, created_at
                from gavahub.app_user order by created_at desc
                """).query(UserSummary.class).list();
    }
}
