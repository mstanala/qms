package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PlantSiteResponse {
    private UUID id;
    private UUID organizationId;
    private String organizationName;
    private String name;
    private String code;
    private String address;
    private String city;
    private String state;
    private String country;
    private String siteType;
    private String fdaRegistration;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
