package com.qmspharma.model.entity;

import com.qmspharma.model.enums.ConfigType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "system_configurations", uniqueConstraints = @UniqueConstraint(columnNames = {"config_key", "module", "plant_site_id"}))
@Data
public class SystemConfiguration {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "config_key", nullable = false)
    private String configKey;

    @Column(name = "config_value", nullable = false, columnDefinition = "TEXT")
    private String configValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "config_type", length = 30)
    private ConfigType configType = ConfigType.STRING;

    @Column(length = 50)
    private String module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id")
    private PlantSite plantSite;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_encrypted", nullable = false)
    private Boolean isEncrypted = false;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;
}
