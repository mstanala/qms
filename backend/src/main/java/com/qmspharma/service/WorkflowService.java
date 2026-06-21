package com.qmspharma.service;

import com.qmspharma.model.dto.response.UserRef;
import com.qmspharma.model.dto.response.WorkflowHistoryResponse;
import com.qmspharma.model.entity.User;
import com.qmspharma.model.entity.WorkflowHistory;
import com.qmspharma.model.enums.WorkflowStepStatus;
import com.qmspharma.repository.WorkflowHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowHistoryRepository workflowHistoryRepository;

    @Transactional
    public void recordStep(String recordType, UUID recordId, String stepName, WorkflowStepStatus status,
                           User assignedTo, String comments, int stepOrder) {
        WorkflowHistory wh = new WorkflowHistory();
        wh.setRecordType(recordType);
        wh.setRecordId(recordId);
        wh.setStepName(stepName);
        wh.setStatus(status);
        wh.setAssignedTo(assignedTo);
        wh.setComments(comments);
        wh.setStepOrder(stepOrder);
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
