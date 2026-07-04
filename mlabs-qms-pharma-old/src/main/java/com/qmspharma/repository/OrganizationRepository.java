package com.qmspharma.repository;

import com.qmspharma.model.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    List<Organization> findByIsActiveTrue();
}
