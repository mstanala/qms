package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "security_profile_permissions", uniqueConstraints = @UniqueConstraint(columnNames = {"security_profile_id", "permission_id"}))
@Data
public class SecurityProfilePermission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "security_profile_id", nullable = false)
    private SecurityProfile securityProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_id", nullable = false)
    private Permission permission;
}
