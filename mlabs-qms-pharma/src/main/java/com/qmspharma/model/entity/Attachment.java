package com.qmspharma.model.entity;

import com.qmspharma.model.enums.AttachmentCategory;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "attachments")
@Data
public class Attachment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "record_type", nullable = false, length = 50)
    private String recordType;

    @Column(name = "record_id", nullable = false)
    private UUID recordId;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "storage_path", nullable = false, length = 1000)
    private String storagePath;

    @Column(name = "gcs_bucket")
    private String gcsBucket;

    @Column(name = "gcs_object_key", length = 1000)
    private String gcsObjectKey;

    @Column(name = "checksum_sha256", length = 64)
    private String checksumSha256;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private AttachmentCategory category = AttachmentCategory.OTHER;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    @Column(name = "uploaded_date", nullable = false)
    private Instant uploadedDate;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by")
    private User deletedBy;

    @PrePersist
    public void prePersist() {
        if (uploadedDate == null) uploadedDate = Instant.now();
    }
}
