package com.qmspharma.model.entity;

import com.qmspharma.model.enums.RecordType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "electronic_signatures")
@Data
public class ElectronicSignature {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "record_type", nullable = false, length = 50)
    private String recordType;

    @Column(name = "record_id", nullable = false)
    private UUID recordId;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false)
    private String meaning;

    @Column(name = "signature_hash", nullable = false, length = 512)
    private String signatureHash;

    @Column(name = "signed_at", nullable = false)
    private Instant signedAt;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    private String comments;

    @Column(name = "is_valid", nullable = false)
    private Boolean isValid = true;

    @Column(name = "invalidated_at")
    private Instant invalidatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invalidated_by")
    private User invalidatedBy;

    @Column(name = "invalidation_reason")
    private String invalidationReason;

    @PrePersist
    public void prePersist() {
        if (signedAt == null) signedAt = Instant.now();
    }
}
