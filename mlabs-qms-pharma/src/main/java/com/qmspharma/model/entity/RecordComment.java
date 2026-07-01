package com.qmspharma.model.entity;

import com.qmspharma.model.enums.CommentType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "record_comments")
@Data
public class RecordComment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "record_type", nullable = false, length = 50)
    private String recordType;

    @Column(name = "record_id", nullable = false)
    private UUID recordId;

    @Column(name = "comment_text", nullable = false, columnDefinition = "TEXT")
    private String commentText;

    @Enumerated(EnumType.STRING)
    @Column(name = "comment_type", length = 30)
    private CommentType commentType = CommentType.GENERAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private RecordComment parentComment;

    @Column(name = "is_internal", nullable = false)
    private Boolean isInternal = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
