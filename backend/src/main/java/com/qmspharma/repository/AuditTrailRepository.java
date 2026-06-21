package com.qmspharma.repository;

import com.qmspharma.model.entity.AuditTrail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface AuditTrailRepository extends JpaRepository<AuditTrail, UUID>, JpaSpecificationExecutor<AuditTrail> {
    List<AuditTrail> findByRecordTypeAndRecordIdOrderByTimestampDesc(String recordType, UUID recordId);
    Page<AuditTrail> findByRecordTypeAndRecordId(String recordType, UUID recordId, Pageable pageable);
}
