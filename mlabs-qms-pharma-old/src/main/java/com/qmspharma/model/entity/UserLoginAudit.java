package com.qmspharma.model.entity;

import com.qmspharma.model.enums.LoginStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_login_audit")
@Data
public class UserLoginAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(name = "login_timestamp", nullable = false)
    private Instant loginTimestamp;

    @Column(name = "logout_timestamp")
    private Instant logoutTimestamp;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Enumerated(EnumType.STRING)
    @Column(name = "login_status", nullable = false, length = 20)
    private LoginStatus loginStatus;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "session_id")
    private String sessionId;

    @PrePersist
    public void prePersist() {
        if (loginTimestamp == null) loginTimestamp = Instant.now();
    }
}
