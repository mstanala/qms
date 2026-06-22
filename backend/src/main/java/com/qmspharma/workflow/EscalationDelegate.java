package com.qmspharma.workflow;

import com.qmspharma.model.enums.NotificationType;
import com.qmspharma.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component("escalationDelegate")
@RequiredArgsConstructor
public class EscalationDelegate implements JavaDelegate {

    private final NotificationService notificationService;

    @Override
    public void execute(DelegateExecution execution) {
        String recordId = (String) execution.getVariable("recordId");
        String recordNumber = getRecordNumber(execution);
        String ownerId = getOwnerId(execution);
        String recordType = resolveRecordType(execution.getProcessDefinitionId());

        if (ownerId == null) {
            log.warn("No owner found for escalation in process {}", execution.getProcessInstanceId());
            return;
        }

        String title = "OVERDUE: " + recordNumber + " requires attention";
        String message = recordType + " " + recordNumber + " has exceeded its target date. Please take immediate action.";

        try {
            notificationService.send(
                    UUID.fromString(ownerId),
                    title, message,
                    NotificationType.ESCALATION,
                    recordType,
                    recordId != null ? UUID.fromString(recordId) : null,
                    recordNumber
            );
            log.info("Escalation sent for {} to user {}", recordNumber, ownerId);
        } catch (Exception e) {
            log.error("Failed to send escalation", e);
        }
    }

    private String getOwnerId(DelegateExecution execution) {
        for (String var : new String[]{"assignedToId", "ownerId", "changeOwnerId", "reportedById"}) {
            Object val = execution.getVariable(var);
            if (val != null) return val.toString();
        }
        return null;
    }

    private String getRecordNumber(DelegateExecution execution) {
        for (String var : new String[]{"deviationNumber", "capaNumber", "changeNumber"}) {
            Object val = execution.getVariable(var);
            if (val != null) return val.toString();
        }
        return null;
    }

    private String resolveRecordType(String processDefinitionId) {
        if (processDefinitionId.startsWith("deviationProcess")) return "DEVIATION";
        if (processDefinitionId.startsWith("capaProcess")) return "CAPA";
        if (processDefinitionId.startsWith("changeControlProcess")) return "CHANGE_CONTROL";
        return "SYSTEM";
    }
}