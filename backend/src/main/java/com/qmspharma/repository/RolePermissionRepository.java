package com.qmspharma.repository;

import com.qmspharma.model.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {
    List<RolePermission> findByRoleId(UUID roleId);
    void deleteByRoleIdAndPermissionId(UUID roleId, UUID permissionId);
}
