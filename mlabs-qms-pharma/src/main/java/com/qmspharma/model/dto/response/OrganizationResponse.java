package com.qmspharma.model.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class OrganizationResponse {
    private UUID id;
    private String name;
    private String code;
    private String type;
    private String address;
    private String city;
    private String state;
    private String country;
    private String phone;
    private String email;
    private String gmpCertification;
    private String licenseNumber;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
