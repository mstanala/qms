package com.qmspharma.model.entity;

import com.qmspharma.model.enums.*;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "document_versions", uniqueConstraints = @UniqueConstraint(columnNames = {"document_id", "version_number"}))
@Data
public class DocumentVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "version_number", nullable = false, length = 20)
    private String versionNumber;

    @Column(name = "major_version", nullable = false)
    private Integer majorVersion = 1;

    @Column(name = "minor_version", nullable = false)
    private Integer minorVersion = 0;

    @Column(name = "change_description", nullable = false, columnDefinition = "TEXT")
    private String changeDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 50)
    private DocumentChangeType changeType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private DocumentVersionStatus status = DocumentVersionStatus.DRAFT;

    @Column(name = "file_path", length = 1000)
    private String filePath;

    @Column(name = "file_name", length = 500)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "content_hash", length = 128)
    private String contentHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(name = "approved_date")
    private Instant approvedDate;

    @Column(name = "effective_date")
    private Instant effectiveDate;

    @Column(name = "superseded_date")
    private Instant supersededDate;

    @OneToMany(mappedBy = "documentVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentApproval> approvals = new ArrayList<>();

    @OneToMany(mappedBy = "documentVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentDistribution> distributions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}