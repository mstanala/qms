package com.qmspharma.controller;

import com.qmspharma.model.dto.response.TaskInboxResponse;
import com.qmspharma.security.CurrentUserProvider;
import com.qmspharma.service.TaskInboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskInboxController {

    private final TaskInboxService taskInboxService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/inbox")
    public ResponseEntity<List<TaskInboxResponse>> getMyTasks(
            @RequestParam(required = false) List<String> candidateGroups) {
        String userId = currentUserProvider.getCurrentUser().getId().toString();
        return ResponseEntity.ok(taskInboxService.getTasksForUser(userId, candidateGroups));
    }

    @GetMapping("/inbox/count")
    public ResponseEntity<Map<String, Long>> getMyTaskCount(
            @RequestParam(required = false) List<String> candidateGroups) {
        String userId = currentUserProvider.getCurrentUser().getId().toString();
        long count = taskInboxService.countTasksForUser(userId, candidateGroups);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/by-record-type/{recordType}")
    public ResponseEntity<List<TaskInboxResponse>> getTasksByRecordType(@PathVariable String recordType) {
        return ResponseEntity.ok(taskInboxService.getTasksByRecordType(recordType));
    }

    @PostMapping("/{taskId}/claim")
    public ResponseEntity<Void> claimTask(@PathVariable String taskId) {
        String userId = currentUserProvider.getCurrentUser().getId().toString();
        taskInboxService.claimTask(taskId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{taskId}/unclaim")
    public ResponseEntity<Void> unclaimTask(@PathVariable String taskId) {
        taskInboxService.unclaimTask(taskId);
        return ResponseEntity.ok().build();
    }
}