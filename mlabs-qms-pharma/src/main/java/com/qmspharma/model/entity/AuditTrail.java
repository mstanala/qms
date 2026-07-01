package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_trail")
@Data
public class AuditTrail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "record_type", nullable = false, length = 50)
    private String recordType;

    @Column(name = "record_id", nullable = false)
    private UUID recordId;

    @Column(name = "record_number", length = 100)
    private String recordNumber;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "field_name")
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "reason_for_change", columnDefinition = "TEXT")
    private String reasonForChange;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "esignature_id")
    private ElectronicSignature esignature;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(nullable = false)
    private Instant timestamp;

    @PrePersist
    public void prePersist() {
        if (timestamp == null) timestamp = Instant.now();
    }
}
