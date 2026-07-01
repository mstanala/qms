package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class SupplierResponse {
    private UUID id;
    private String supplierNumber;
    private String name;
    private String legalName;
    private String supplierType;
    private String category;
    private String status;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String primaryContactName;
    private String primaryContactEmail;
    private String primaryContactPhone;
    private String gmpCertification;
    private String isoCertification;
    private String fdaRegistration;
    private String dunsNumber;
    private Instant qualificationDate;
    private Instant nextRequalificationDate;
    private Integer requalificationFrequencyMonths;
    private BigDecimal overallScore;
    private BigDecimal qualityScore;
    private BigDecimal deliveryScore;
    private BigDecimal complianceScore;
    private ReferenceResponse owner;
    private ReferenceResponse plantSite;
    private String currentWorkflowStep;
    private Instant createdAt;
    private Instant updatedAt;
}
