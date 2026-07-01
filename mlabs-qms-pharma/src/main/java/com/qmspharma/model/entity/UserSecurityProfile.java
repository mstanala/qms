package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_security_profiles", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "security_profile_id"}))
@Data
public class UserSecurityProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "security_profile_id", nullable = false)
    private SecurityProfile securityProfile;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @PrePersist
    public void prePersist() {
        if (assignedAt == null) assignedAt = Instant.now();
    }
}
