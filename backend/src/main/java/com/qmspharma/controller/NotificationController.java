package com.qmspharma.controller;

import com.qmspharma.model.dto.response.NotificationResponse;
import com.qmspharma.security.CurrentUserProvider;
import com.qmspharma.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> list(@RequestParam(required = false) Boolean isRead, Pageable pageable) {
        return ResponseEntity.ok(notificationService.getNotifications(currentUserProvider.getCurrentUserId(), isRead, pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(currentUserProvider.getCurrentUserId())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead(currentUserProvider.getCurrentUserId());
        return ResponseEntity.ok().build();
    }
}
