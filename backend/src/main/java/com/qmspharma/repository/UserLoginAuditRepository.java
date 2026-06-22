package com.qmspharma.repository;

import com.qmspharma.model.entity.UserLoginAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserLoginAuditRepository extends JpaRepository<UserLoginAudit, UUID> {
}
