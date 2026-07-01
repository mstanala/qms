package com.qmspharma.repository;

import com.qmspharma.model.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    List<UserRole> findByUserIdAndIsActiveTrue(UUID userId);
    void deleteByUserIdAndRoleId(UUID userId, UUID roleId);
    boolean existsByUserIdAndRoleId(UUID userId, UUID roleId);
}
