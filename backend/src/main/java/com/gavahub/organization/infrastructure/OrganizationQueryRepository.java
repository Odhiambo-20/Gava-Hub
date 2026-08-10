package com.gavahub.organization.infrastructure;

import com.gavahub.organization.domain.OrganizationSummary;
import com.gavahub.organization.domain.OrganizationMemberSummary;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class OrganizationQueryRepository {
    private final JdbcClient jdbc;

    public OrganizationQueryRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<OrganizationSummary> findById(UUID id) {
        return jdbc.sql("""
                        select id, legal_name, trading_name, organization_type, status, created_at
                        from gavahub.organization where id = :id
                        """)
                .param("id", id)
                .query(OrganizationSummary.class)
                .optional();
    }

    public List<OrganizationSummary> findActive() {
        return jdbc.sql("""
                        select id, legal_name, trading_name, organization_type, status, created_at
                        from gavahub.organization where status = 'ACTIVE' order by legal_name limit 100
                        """)
                .query(OrganizationSummary.class)
                .list();
    }
    public List<OrganizationSummary> findByMember(UUID userId) {
        return jdbc.sql("""
                select o.id,o.legal_name,o.trading_name,o.organization_type,o.status,o.created_at
                from gavahub.organization o join gavahub.organization_member m on m.organization_id=o.id
                where m.user_id=:userId and m.status='ACTIVE' order by o.legal_name
                """).param("userId",userId).query(OrganizationSummary.class).list();
    }
    public List<OrganizationMemberSummary> findMembers(UUID organizationId) {
        return jdbc.sql("""
                select m.organization_id,m.user_id,u.email::text,u.display_name,m.member_role,m.status,m.joined_at
                from gavahub.organization_member m join gavahub.app_user u on u.id=m.user_id
                where m.organization_id=:id order by u.display_name
                """).param("id",organizationId).query(OrganizationMemberSummary.class).list();
    }
}
