package com.qmspharma.repository;

import com.qmspharma.model.entity.SecurityProfilePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SecurityProfilePermissionRepository extends JpaRepository<SecurityProfilePermission, UUID> {
    List<SecurityProfilePermission> findBySecurityProfileId(UUID securityProfileId);
}
