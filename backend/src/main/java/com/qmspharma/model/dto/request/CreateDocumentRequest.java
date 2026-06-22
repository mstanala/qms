package com.qmspharma.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateDocumentRequest {
    @NotBlank private String title;
    private String description;
    @NotNull private String documentType;
    private String category;
    private String subCategory;
    private UUID departmentId;
    private UUID plantSiteId;
    private Integer reviewPeriodMonths;
    private String confidentialityLevel;
    private String regulatoryReference;
    private String keywords;
}