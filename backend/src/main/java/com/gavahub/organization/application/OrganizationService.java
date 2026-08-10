package com.gavahub.organization.application;

import com.gavahub.organization.domain.OrganizationSummary;
import com.gavahub.organization.domain.OrganizationMemberSummary;
import com.gavahub.organization.infrastructure.OrganizationQueryRepository;
import com.gavahub.shared.exception.ResourceNotFoundException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.simple.JdbcClient;

@Service
public class OrganizationService {
    private final OrganizationQueryRepository organizations;
    private final JdbcClient jdbc;

    public OrganizationService(OrganizationQueryRepository organizations, JdbcClient jdbc) {
        this.organizations = organizations; this.jdbc=jdbc;
    }

    @Transactional(readOnly = true)
    public OrganizationSummary get(UUID id) {
        return organizations.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
    }

    @Transactional(readOnly = true)
    public List<OrganizationSummary> listActive() {
        return organizations.findActive();
    }
    @Transactional(readOnly=true) public List<OrganizationSummary> forUser(UUID userId){return organizations.findByMember(userId);}
    @Transactional(readOnly=true) public List<OrganizationMemberSummary> members(UUID id){get(id);return organizations.findMembers(id);}
    @Transactional public List<OrganizationMemberSummary> addMember(UUID id,UUID userId,String role){
        get(id);jdbc.sql("""
                insert into gavahub.organization_member(organization_id,user_id,member_role,status,joined_at)
                values(:organizationId,:userId,:role,'ACTIVE',clock_timestamp())
                on conflict(organization_id,user_id) do update set member_role=excluded.member_role,status='ACTIVE',joined_at=clock_timestamp()
                """).param("organizationId",id).param("userId",userId).param("role",role).update();return members(id);}
    @Transactional public void removeMember(UUID id,UUID userId){
        int changed=jdbc.sql("update gavahub.organization_member set status='REMOVED' where organization_id=:id and user_id=:userId")
                .param("id",id).param("userId",userId).update();if(changed==0)throw new ResourceNotFoundException("Organization member not found");}
    @Transactional public OrganizationSummary create(String legalName,String tradingName,String type,String registrationNumber) {
        UUID id=UUID.randomUUID(); jdbc.sql("""
                insert into gavahub.organization(id,legal_name,trading_name,organization_type,registration_number,status)
                values(:id,:legal,:trading,:type,:registration,'PENDING')
                """).param("id",id).param("legal",legalName).param("trading",tradingName).param("type",type)
                .param("registration",registrationNumber).update(); return get(id);
    }
    @Transactional public OrganizationSummary update(UUID id,String legalName,String tradingName,String status) {
        get(id); jdbc.sql("update gavahub.organization set legal_name=:legal,trading_name=:trading,status=:status where id=:id")
                .param("legal",legalName).param("trading",tradingName).param("status",status).param("id",id).update(); return get(id);
    }
    @Transactional public void close(UUID id) { get(id); jdbc.sql("update gavahub.organization set status='CLOSED' where id=:id").param("id",id).update(); }
}
