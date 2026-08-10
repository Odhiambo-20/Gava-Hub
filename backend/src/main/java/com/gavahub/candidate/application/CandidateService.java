package com.gavahub.candidate.application;

import com.gavahub.candidate.domain.CandidateSummary;
import com.gavahub.candidate.infrastructure.CandidateQueryRepository;
import com.gavahub.shared.exception.ResourceNotFoundException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.simple.JdbcClient;
import java.time.LocalDate;
import java.util.List;

@Service
public class CandidateService {
    private final CandidateQueryRepository candidates;
    private final JdbcClient jdbc;

    public CandidateService(CandidateQueryRepository candidates,JdbcClient jdbc) {
        this.candidates = candidates; this.jdbc=jdbc;
    }

    @Transactional(readOnly = true)
    public CandidateSummary get(UUID id) {
        return candidates.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found"));
    }
    @Transactional(readOnly = true) public List<CandidateSummary> list(){return candidates.findAll();}
    @Transactional(readOnly = true) public List<CandidateSummary> forUser(UUID userId){return candidates.findByUserId(userId);}
    @Transactional public CandidateSummary create(UUID userId,String given,String family,LocalDate dob,String headline){
        UUID id=UUID.randomUUID();jdbc.sql("""
                insert into gavahub.candidate_profile(id,user_id,given_name,family_name,date_of_birth,headline)
                values(:id,:user,:given,:family,:dob,:headline)
                """).param("id",id).param("user",userId).param("given",given).param("family",family)
                .param("dob",dob).param("headline",headline).update();return get(id);}
    @Transactional public CandidateSummary update(UUID id,String given,String family,LocalDate dob,String headline,String status){
        get(id);jdbc.sql("""
                update gavahub.candidate_profile set given_name=:given,family_name=:family,date_of_birth=:dob,
                headline=:headline,profile_status=:status where id=:id
                """).param("given",given).param("family",family).param("dob",dob).param("headline",headline)
                .param("status",status).param("id",id).update();return get(id);}
    @Transactional public void archive(UUID id){get(id);jdbc.sql("update gavahub.candidate_profile set profile_status='ARCHIVED' where id=:id").param("id",id).update();}
}
