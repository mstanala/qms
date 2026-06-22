package com.qmspharma.service;

import com.qmspharma.model.dto.response.UserRef;
import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
import com.qmspharma.model.entity.User;
import com.qmspharma.model.entity.WorkflowHistory;
import com.qmspharma.model.enums.WorkflowStepStatus;
import com.qmspharma.repository.WorkflowHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowHistoryRepository workflowHistoryRepository;
    private final RuntimeService runtimeService;
    private final TaskService taskService;

    /**
     * Start a Flowable process for a record.
     * @return the process instance ID
     */
    @Transactional
    public String startProcess(String processKey, String businessKey, Map<String, Object> variables) {
        try {
            ProcessInstance pi = runtimeService.startProcessInstanceByKey(processKey, businessKey, variables);
            log.info("Started process {} for business key {} -> instance {}", processKey, businessKey, pi.getId());
            return pi.getId();
        } catch (Exception e) {
            log.error("Failed to start process {} for {}", processKey, businessKey, e);
            return null;
        }
    }

    /**
     * Complete the current active task for a record.
     * Finds the task by process instance and task definition key, then completes it.
     */
    @Transactional
    public void completeTask(String processInstanceId, String taskDefinitionKey, Map<String, Object> variables) {
        if (processInstanceId == null) {
            log.warn("No process instance ID provided for task completion: {}", taskDefinitionKey);
            return;
        }
        try {
            Task task = taskService.createTaskQuery()
                    .processInstanceId(processInstanceId)
                    .taskDefinitionKey(taskDefinitionKey)
                    .singleResult();

            if (task != null) {
                taskService.complete(task.getId(), variables != null ? variables : new HashMap<>());
                log.info("Completed task {} ({}) in process {}", task.getName(), taskDefinitionKey, processInstanceId);
            } else {
                log.warn("No active task found with key {} in process {}", taskDefinitionKey, processInstanceId);
            }
        } catch (Exception e) {
            log.error("Failed to complete task {} in process {}", taskDefinitionKey, processInstanceId, e);
        }
    }

    /**
     * Complete the current active task by finding it via the process instance (any active task).
     */
    @Transactional
    public void completeCurrentTask(String processInstanceId, Map<String, Object> variables) {
        if (processInstanceId == null) return;
        try {
            List<Task> tasks = taskService.createTaskQuery()
                    .processInstanceId(processInstanceId)
                    .list();

            if (!tasks.isEmpty()) {
                Task task = tasks.get(0);
                taskService.complete(task.getId(), variables != null ? variables : new HashMap<>());
                log.info("Completed current task {} in process {}", task.getName(), processInstanceId);
            }
        } catch (Exception e) {
            log.error("Failed to complete current task in process {}", processInstanceId, e);
        }
    }

    /**
     * Get active tasks for a user (their inbox).
     */
    @Transactional(readOnly = true)
    public List<Task> getTasksForUser(String userId, String candidateGroup) {
        if (candidateGroup != null) {
            return taskService.createTaskQuery()
                    .taskCandidateGroup(candidateGroup)
                    .orderByTaskCreateTime().desc()
                    .list();
        }
        return taskService.createTaskQuery()
                .taskAssignee(userId)
                .orderByTaskCreateTime().desc()
                .list();
    }

    /**
     * Get all active tasks assigned to or candidate for a user.
     */
    @Transactional(readOnly = true)
    public List<Task> getInboxTasks(String userId, List<String> candidateGroups) {
        var query = taskService.createTaskQuery();
        if (candidateGroups != null && !candidateGroups.isEmpty()) {
            query.or()
                    .taskAssignee(userId)
                    .taskCandidateGroupIn(candidateGroups)
                    .endOr();
        } else {
            query.taskAssignee(userId);
        }
        return query.orderByTaskCreateTime().desc().list();
    }

    /**
     * Claim a task for a user.
     */
    @Transactional
    public void claimTask(String taskId, String userId) {
        taskService.claim(taskId, userId);
        log.info("Task {} claimed by user {}", taskId, userId);
    }

    /**
     * Get task by ID.
     */
    @Transactional(readOnly = true)
    public Task getTask(String taskId) {
        return taskService.createTaskQuery().taskId(taskId).singleResult();
    }

    /**
     * Update a process variable.
     */
    @Transactional
    public void updateProcessVariable(String processInstanceId, String variableName, Object value) {
        if (processInstanceId == null) return;
        runtimeService.setVariable(processInstanceId, variableName, value);
    }

    /**
     * Record a workflow step in the history table (dual tracking with Flowable).
     */
    @Transactional
    public void recordStep(String recordType, UUID recordId, String stepName, WorkflowStepStatus status,
                           User assignedTo, String comments, int stepOrder) {
        recordStep(recordType, recordId, stepName, status, assignedTo, comments, stepOrder, null);
    }

    @Transactional
    public void recordStep(String recordType, UUID recordId, String stepName, WorkflowStepStatus status,
                           User assignedTo, String comments, int stepOrder, String flowableTaskId) {
        // Mark previous CURRENT steps as COMPLETED
        if (status == WorkflowStepStatus.CURRENT) {
            workflowHistoryRepository.findByRecordTypeAndRecordIdOrderByStepOrderAsc(recordType, recordId)
                    .stream()
                    .filter(wh -> wh.getStatus() == WorkflowStepStatus.CURRENT)
                    .forEach(wh -> {
                        wh.setStatus(WorkflowStepStatus.COMPLETED);
                        wh.setCompletedAt(Instant.now());
                        workflowHistoryRepository.save(wh);
                    });
        }

        WorkflowHistory wh = new WorkflowHistory();
        wh.setRecordType(recordType);
        wh.setRecordId(recordId);
        wh.setStepName(stepName);
        wh.setStatus(status);
        wh.setAssignedTo(assignedTo);
        wh.setComments(comments);
        wh.setStepOrder(stepOrder);
        wh.setFlowableTaskId(flowableTaskId);
        if (status == WorkflowStepStatus.CURRENT) {
            wh.setStartedAt(Instant.now());
        } else if (status == WorkflowStepStatus.COMPLETED) {
            wh.setStartedAt(Instant.now());
            wh.setCompletedAt(Instant.now());
        }
        workflowHistoryRepository.save(wh);
    }

    @Transactional(readOnly = true)
    public List<WorkflowHistoryResponse> getHistory(String recordType, UUID recordId) {
        return workflowHistoryRepository.findByRecordTypeAndRecordIdOrderByStepOrderAsc(recordType, recordId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Get the current active Flowable task name for a process instance.
     */
    @Transactional(readOnly = true)
    public String getCurrentTaskName(String processInstanceId) {
        if (processInstanceId == null) return null;
        List<Task> tasks = taskService.createTaskQuery()
                .processInstanceId(processInstanceId)
                .list();
        return tasks.isEmpty() ? null : tasks.get(0).getName();
    }

    /**
     * Check if a process instance is still active.
     */
    @Transactional(readOnly = true)
    public boolean isProcessActive(String processInstanceId) {
        if (processInstanceId == null) return false;
        return runtimeService.createProcessInstanceQuery()
                .processInstanceId(processInstanceId)
                .count() > 0;
    }

    private WorkflowHistoryResponse toResponse(WorkflowHistory wh) {
        return WorkflowHistoryResponse.builder()
                .id(wh.getId()).stepName(wh.getStepName()).status(wh.getStatus().name())
                .assignedTo(wh.getAssignedTo() != null ? UserRef.builder()
                        .id(wh.getAssignedTo().getId())
                        .displayName(wh.getAssignedTo().getDisplayName())
                        .email(wh.getAssignedTo().getEmail()).build() : null)
                .startedAt(wh.getStartedAt()).completedAt(wh.getCompletedAt())
                .comments(wh.getComments()).stepOrder(wh.getStepOrder()).build();
    }
}