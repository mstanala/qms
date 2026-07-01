package com.qmspharma.repository;

import com.qmspharma.model.entity.UserSecurityProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface UserSecurityProfileRepository extends JpaRepository<UserSecurityProfile, UUID> {
    List<UserSecurityProfile> findByUserId(UUID userId);
}
