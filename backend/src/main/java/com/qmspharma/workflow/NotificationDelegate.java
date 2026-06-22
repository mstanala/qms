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
@Component("notificationDelegate")
@RequiredArgsConstructor
public class NotificationDelegate implements JavaDelegate {

    private final NotificationService notificationService;

    @Override
    public void execute(DelegateExecution execution) {
        String notificationType = getField(execution, "notificationType", "SYSTEM");
        String titleTemplate = getField(execution, "titleTemplate", "Workflow Notification");
        String messageTemplate = getField(execution, "messageTemplate", "A workflow action requires your attention");
        String recipientVariable = getField(execution, "recipientVariable", null);

        String recipientId = recipientVariable != null
                ? (String) execution.getVariable(recipientVariable) : null;

        if (recipientId == null) {
            log.warn("No recipient found for notification in process {}", execution.getProcessInstanceId());
            return;
        }

        String title = resolveTemplate(titleTemplate, execution);
        String message = resolveTemplate(messageTemplate, execution);

        String recordType = resolveRecordType(execution.getProcessDefinitionId());
        String recordId = (String) execution.getVariable("recordId");
        String recordNumber = getRecordNumber(execution);

        try {
            notificationService.send(
                    UUID.fromString(recipientId),
                    title, message,
                    NotificationType.valueOf(notificationType),
                    recordType,
                    recordId != null ? UUID.fromString(recordId) : null,
                    recordNumber
            );
            log.debug("Notification sent: {} -> {}", title, recipientId);
        } catch (Exception e) {
            log.error("Failed to send workflow notification", e);
        }
    }

    private String resolveTemplate(String template, DelegateExecution execution) {
        String result = template;
        for (String varName : new String[]{"deviationNumber", "capaNumber", "changeNumber", "recordId"}) {
            Object val = execution.getVariable(varName);
            if (val != null) {
                result = result.replace("{" + varName + "}", val.toString());
            }
        }
        return result;
    }

    private String resolveRecordType(String processDefinitionId) {
        if (processDefinitionId.startsWith("deviationProcess")) return "DEVIATION";
        if (processDefinitionId.startsWith("capaProcess")) return "CAPA";
        if (processDefinitionId.startsWith("changeControlProcess")) return "CHANGE_CONTROL";
        return "SYSTEM";
    }

    private String getRecordNumber(DelegateExecution execution) {
        for (String varName : new String[]{"deviationNumber", "capaNumber", "changeNumber"}) {
            Object val = execution.getVariable(varName);
            if (val != null) return val.toString();
        }
        return null;
    }

    private String getField(DelegateExecution execution, String fieldName, String defaultValue) {
        Object val = execution.getVariable("_field_" + fieldName);
        if (val != null) return val.toString();
        // Try from extension elements via expression
        try {
            val = execution.getVariable(fieldName);
            if (val != null) return val.toString();
        } catch (Exception ignored) {}
        return defaultValue;
    }
}