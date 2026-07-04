package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class EquipmentResponse {
    private UUID id;
    private String equipmentNumber;
    private String name;
    private String description;
    private String equipmentType;
    private String category;
    private String status;
    private String manufacturer;
    private String modelNumber;
    private String serialNumber;
    private String assetTag;
    private PlantSiteSummary plantSite;
    private DepartmentSummary department;
    private String area;
    private String roomNumber;
    private LocalDate installationDate;
    private LocalDate commissioningDate;
    private LocalDate qualificationDate;
    private LocalDate nextQualificationDate;
    private String qualificationStatus;
    private Boolean calibrationRequired;
    private Integer calibrationFrequencyDays;
    private LocalDate lastCalibrationDate;
    private LocalDate nextCalibrationDate;
    private String calibrationStatus;
    private Integer maintenanceFrequencyDays;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    private UserRef owner;
    private Boolean gxpRelevant;
    private Boolean computerizedSystem;
    private String dataIntegrityClass;
    private LocalDate decommissionDate;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    public static class PlantSiteSummary {
        private UUID id;
        private String name;
        private String code;
    }

    @Data
    @Builder
    public static class DepartmentSummary {
        private UUID id;
        private String name;
        private String code;
    }
}
