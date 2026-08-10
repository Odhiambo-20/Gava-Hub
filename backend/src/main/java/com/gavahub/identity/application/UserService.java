package com.gavahub.identity.application;

import com.gavahub.identity.domain.UserSummary;
import com.gavahub.identity.infrastructure.UserQueryRepository;
import com.gavahub.shared.exception.ResourceNotFoundException;
import java.util.UUID;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserQueryRepository users;
    private final JdbcClient jdbc;

    public UserService(UserQueryRepository users, JdbcClient jdbc) {
        this.users = users;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public UserSummary get(UUID id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public List<UserSummary> list() { return users.findAll(); }

    @Transactional
    public UserSummary update(UUID id, String displayName, String status) {
        get(id);
        jdbc.sql("update gavahub.app_user set display_name=:name,status=:status where id=:id")
                .param("name", displayName.trim()).param("status", status).param("id", id).update();
        return get(id);
    }

    @Transactional
    public void disable(UUID id) {
        get(id);
        jdbc.sql("update gavahub.app_user set status='DISABLED' where id=:id").param("id", id).update();
    }

    @Transactional
    public UserSummary grantRole(UUID id, String role) {
        get(id);
        int changed = jdbc.sql("""
                insert into gavahub.user_role(user_id,role_id)
                select :userId,id from gavahub.role where code=:role
                on conflict do nothing
                """).param("userId", id).param("role", role).update();
        if (changed == 0 && jdbc.sql("select count(*) from gavahub.role where code=:role")
                .param("role", role).query(Integer.class).single() == 0) {
            throw new ResourceNotFoundException("Role not found");
        }
        return get(id);
    }
    @Transactional(readOnly=true) public List<String> roles(UUID id){
        get(id);return jdbc.sql("""
                select r.code from gavahub.role r join gavahub.user_role ur on ur.role_id=r.id
                where ur.user_id=:id order by r.code
                """).param("id",id).query(String.class).list();}
    @Transactional public void revokeRole(UUID id,String role){
        if("ROLE_USER".equals(role)) throw new com.gavahub.shared.exception.ConflictException("The base user role cannot be removed");
        jdbc.sql("delete from gavahub.user_role ur using gavahub.role r where ur.role_id=r.id and ur.user_id=:id and r.code=:role")
                .param("id",id).param("role",role).update();}
}
