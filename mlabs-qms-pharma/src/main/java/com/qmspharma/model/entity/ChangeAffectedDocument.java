package com.qmspharma.model.entity;

import com.qmspharma.model.enums.CompletionStatus;
import com.qmspharma.model.enums.DocumentAction;
import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "change_affected_documents")
@Data
public class ChangeAffectedDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id", nullable = false)
    private ChangeRequest changeRequest;

    @Column(name = "document_number", nullable = false, length = 100)
    private String documentNumber;

    @Column(name = "document_title", nullable = false, length = 500)
    private String documentTitle;

    @Column(name = "document_type", length = 100)
    private String documentType;

    @Column(name = "current_version", length = 50)
    private String currentVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentAction action;

    @Column(name = "new_version", length = 50)
    private String newVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompletionStatus status = CompletionStatus.PENDING;
}
