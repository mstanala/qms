package com.qmspharma.model.entity;

import com.qmspharma.model.enums.ConversationStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "ai_conversations")
@Data
@EqualsAndHashCode(callSuper = true)
public class AiConversation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 500)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @Column(name = "module_context", length = 50)
    private String moduleContext;

    @Column(name = "record_id")
    private java.util.UUID recordId;

    @Column(name = "record_type", length = 50)
    private String recordType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<AiMessage> messages = new ArrayList<>();
}
