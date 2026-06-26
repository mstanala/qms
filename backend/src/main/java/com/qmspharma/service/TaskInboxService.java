package com.qmspharma.service;

import com.qmspharma.model.dto.response.TaskInboxResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskInboxService {

    private final TaskService taskService;
    private final RuntimeService runtimeService;

    @Transactional(readOnly = true)
    public List<TaskInboxResponse> getTasksForUser(String userId, List<String> candidateGroups) {
        var query = taskService.createTaskQuery();

        if (candidateGroups != null && !candidateGroups.isEmpty()) {
            query.or()
                    .taskAssignee(userId)
                    .taskCandidateGroupIn(candidateGroups)
                    .endOr();
        } else {
            query.taskAssignee(userId);
        }

        List<Task> tasks = query.orderByTaskCreateTime().desc().list();
        return tasks.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskInboxResponse> getTasksByRecordType(String recordType) {
        String processKey = resolveProcessKey(recordType);
        if (processKey == null) return List.of();

        List<Task> tasks = taskService.createTaskQuery()
                .processDefinitionKey(processKey)
                .orderByTaskCreateTime().desc()
                .list();
        return tasks.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void claimTask(String taskId, String userId) {
        taskService.claim(taskId, userId);
        log.info("Task {} claimed by {}", taskId, userId);
    }

    @Transactional
    public void unclaimTask(String taskId) {
        taskService.unclaim(taskId);
        log.info("Task {} unclaimed", taskId);
    }

    @Transactional(readOnly = true)
    public long countTasksForUser(String userId, List<String> candidateGroups) {
        var query = taskService.createTaskQuery();
        if (candidateGroups != null && !candidateGroups.isEmpty()) {
            query.or()
                    .taskAssignee(userId)
                    .taskCandidateGroupIn(candidateGroups)
                    .endOr();
        } else {
            query.taskAssignee(userId);
        }
        return query.count();
    }

    private TaskInboxResponse toResponse(Task task) {
        Map<String, Object> vars = taskService.getVariables(task.getId());
        String processDefKey = resolveProcessDefKey(task.getProcessDefinitionId());

        return TaskInboxResponse.builder()
                .taskId(task.getId())
                .taskName(task.getName())
                .taskDefinitionKey(task.getTaskDefinitionKey())
                .processInstanceId(task.getProcessInstanceId())
                .processDefinitionKey(processDefKey)
                .recordType(resolveRecordType(processDefKey))
                .recordId(vars != null ? (String) vars.get("recordId") : null)
                .recordNumber(resolveRecordNumber(vars, processDefKey))
                .assignee(task.getAssignee())
                .description(task.getDescription())
                .createTime(task.getCreateTime() != null ? task.getCreateTime().toInstant() : null)
                .dueDate(task.getDueDate() != null ? task.getDueDate().toInstant() : null)
                .formKey(task.getFormKey())
                .priority(task.getPriority())
                .build();
    }

    private String resolveProcessDefKey(String processDefinitionId) {
        if (processDefinitionId == null) return null;
        // Process definition IDs are like "deviationProcess:1:12345"
        int colonIdx = processDefinitionId.indexOf(':');
        return colonIdx > 0 ? processDefinitionId.substring(0, colonIdx) : processDefinitionId;
    }

    private String resolveRecordType(String processDefKey) {
        if (processDefKey == null) return "SYSTEM";
        return switch (processDefKey) {
            case "deviationProcess" -> "DEVIATION";
            case "capaProcess" -> "CAPA";
            case "changeControlProcess" -> "CHANGE_CONTROL";
            case "documentProcess" -> "DOCUMENT";
            default -> "SYSTEM";
        };
    }

    private String resolveProcessKey(String recordType) {
        return switch (recordType.toUpperCase()) {
            case "DEVIATION" -> "deviationProcess";
            case "CAPA" -> "capaProcess";
            case "CHANGE_CONTROL" -> "changeControlProcess";
            case "DOCUMENT" -> "documentProcess";
            default -> null;
        };
    }

    private String resolveRecordNumber(Map<String, Object> vars, String processDefKey) {
        if (vars == null) return null;
        if ("deviationProcess".equals(processDefKey)) return (String) vars.get("deviationNumber");
        if ("capaProcess".equals(processDefKey)) return (String) vars.get("capaNumber");
        if ("changeControlProcess".equals(processDefKey)) return (String) vars.get("changeNumber");
        if ("documentProcess".equals(processDefKey)) return (String) vars.get("documentNumber");
        return null;
    }
}
