package com.qmspharma.repository;

import com.qmspharma.model.entity.UserLoginAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserLoginAuditRepository extends JpaRepository<UserLoginAudit, UUID> {
    Page<UserLoginAudit> findByUserId(UUID userId, Pageable pageable);
}
