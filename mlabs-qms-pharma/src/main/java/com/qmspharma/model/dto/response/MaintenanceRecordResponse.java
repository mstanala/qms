package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class MaintenanceRecordResponse {
    private UUID id;
    private String maintenanceNumber;
    private UUID equipmentId;
    private String equipmentNumber;
    private String equipmentName;
    private String maintenanceType;
    private String status;
    private String priority;
    private Instant scheduledDate;
    private Instant completedDate;
    private UserRef performedBy;
    private String workPerformed;
    private String partsReplaced;
    private LocalDate nextMaintenanceDate;
    private BigDecimal downtimeHours;
    private Boolean impactOnProduction;
    private Boolean requalificationRequired;
    private UUID deviationId;
    private Instant createdAt;
    private Instant updatedAt;
}
