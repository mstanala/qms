package com.qmspharma.repository;

import com.qmspharma.model.entity.ApplicationRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRoleRepository extends JpaRepository<ApplicationRole, UUID> {
    Optional<ApplicationRole> findByCode(String code);
    List<ApplicationRole> findByIsActiveTrue();
    boolean existsByCode(String code);
}
