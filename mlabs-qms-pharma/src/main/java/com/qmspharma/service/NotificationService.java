package com.qmspharma.service;

import com.qmspharma.model.dto.response.NotificationResponse;
import com.qmspharma.model.entity.Notification;
import com.qmspharma.model.entity.User;
import com.qmspharma.model.enums.NotificationType;
import com.qmspharma.repository.NotificationRepository;
import com.qmspharma.repository.UserRepository;
import com.qmspharma.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void send(UUID userId, String title, String message, NotificationType type,
                     String recordType, UUID recordId, String recordNumber) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setNotificationType(type);
        n.setRecordType(recordType);
        n.setRecordId(recordId);
        n.setRecordNumber(recordNumber);
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(UUID userId, Boolean isRead, Pageable pageable) {
        Page<Notification> page = isRead != null
                ? notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, isRead, pageable)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        n.setIsRead(true);
        n.setReadAt(Instant.now());
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsRead(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId()).title(n.getTitle()).message(n.getMessage())
                .notificationType(n.getNotificationType().name())
                .recordType(n.getRecordType()).recordId(n.getRecordId())
                .recordNumber(n.getRecordNumber()).isRead(n.getIsRead())
                .readAt(n.getReadAt()).priority(n.getPriority().name())
                .createdAt(n.getCreatedAt()).build();
    }
}
