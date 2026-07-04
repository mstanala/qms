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
@Component("reminderDelegate")
@RequiredArgsConstructor
public class ReminderDelegate implements JavaDelegate {

    private final NotificationService notificationService;

    @Override
    public void execute(DelegateExecution execution) {
        String ownerId = (String) execution.getVariable("ownerId");
        String recordNumber = getRecordNumber(execution);
        String recordId = (String) execution.getVariable("recordId");
        String recordType = resolveRecordType(execution.getProcessDefinitionId());

        if (ownerId == null) return;

        try {
            notificationService.send(
                    UUID.fromString(ownerId),
                    "Reminder: " + recordNumber,
                    recordType + " " + recordNumber + " has pending actions. Please review progress.",
                    NotificationType.REMINDER,
                    recordType,
                    recordId != null ? UUID.fromString(recordId) : null,
                    recordNumber
            );
            log.debug("Reminder sent for {} to {}", recordNumber, ownerId);
        } catch (Exception e) {
            log.error("Failed to send reminder", e);
        }
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