package com.qmspharma.model.entity;

import com.qmspharma.model.enums.NotificationPriority;
import com.qmspharma.model.enums.NotificationType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 30)
    private NotificationType notificationType;

    @Column(name = "record_type", length = 50)
    private String recordType;

    @Column(name = "record_id")
    private UUID recordId;

    @Column(name = "record_number", length = 100)
    private String recordNumber;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "is_email_sent", nullable = false)
    private Boolean isEmailSent = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private NotificationPriority priority = NotificationPriority.NORMAL;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
