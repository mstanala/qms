package com.qmspharma.repository;

import com.qmspharma.model.entity.SecurityProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SecurityProfileRepository extends JpaRepository<SecurityProfile, UUID> {
    List<SecurityProfile> findByIsActiveTrue();
}
