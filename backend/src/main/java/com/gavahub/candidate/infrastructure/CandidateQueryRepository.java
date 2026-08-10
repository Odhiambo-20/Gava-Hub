package com.gavahub.candidate.infrastructure;

import com.gavahub.candidate.domain.CandidateSummary;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class CandidateQueryRepository {
    private final JdbcClient jdbc;

    public CandidateQueryRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<CandidateSummary> findById(UUID id) {
        return jdbc.sql("""
                        select id, user_id, given_name, family_name, headline, profile_status, created_at
                        from gavahub.candidate_profile where id = :id
                        """)
                .param("id", id)
                .query(CandidateSummary.class)
                .optional();
    }
    public List<CandidateSummary> findAll() {
        return jdbc.sql("""
                select id,user_id,given_name,family_name,headline,profile_status,created_at
                from gavahub.candidate_profile order by created_at desc
                """).query(CandidateSummary.class).list();
    }
    public List<CandidateSummary> findByUserId(UUID userId) {
        return jdbc.sql("""
                select id,user_id,given_name,family_name,headline,profile_status,created_at
                from gavahub.candidate_profile where user_id=:userId order by created_at desc
                """).param("userId",userId).query(CandidateSummary.class).list();
    }
}
