package com.qmspharma.model.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class UpdateDocumentRequest {
    private String title;
    private String description;
    private String documentType;
    private String category;
    private String subCategory;
    private UUID departmentId;
    private UUID plantSiteId;
    private Integer reviewPeriodMonths;
    private String confidentialityLevel;
    private String regulatoryReference;
    private String keywords;
}