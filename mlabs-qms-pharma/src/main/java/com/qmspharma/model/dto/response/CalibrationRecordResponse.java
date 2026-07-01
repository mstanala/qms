package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class CalibrationRecordResponse {
    private UUID id;
    private String calibrationNumber;
    private UUID equipmentId;
    private String equipmentNumber;
    private String equipmentName;
    private String calibrationType;
    private String status;
    private Instant scheduledDate;
    private Instant performedDate;
    private UserRef performedBy;
    private String result;
    private String standardUsed;
    private String standardCertificate;
    private String asFoundReading;
    private String asLeftReading;
    private String tolerance;
    private String uncertainty;
    private Boolean adjustmentMade;
    private String adjustmentDetails;
    private UserRef reviewedBy;
    private Instant reviewDate;
    private LocalDate nextCalibrationDate;
    private Boolean impactAssessmentRequired;
    private String impactOnResults;
    private UUID deviationId;
    private String certificatePath;
    private Instant createdAt;
    private Instant updatedAt;
}
