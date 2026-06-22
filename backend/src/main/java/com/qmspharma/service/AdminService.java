package com.qmspharma.service;

import com.qmspharma.exception.ResourceNotFoundException;
import com.qmspharma.model.dto.request.CreateDepartmentRequest;
import com.qmspharma.model.dto.request.UpdateConfigRequest;
import com.qmspharma.model.dto.response.DepartmentResponse;
import com.qmspharma.model.dto.response.OrganizationResponse;
import com.qmspharma.model.dto.response.PlantSiteResponse;
import com.qmspharma.model.dto.response.SystemConfigurationResponse;
import com.qmspharma.model.entity.*;
import com.qmspharma.model.enums.ConfigType;
import com.qmspharma.repository.*;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final SystemConfigurationRepository configRepository;
    private final OrganizationRepository organizationRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final DepartmentRepository departmentRepository;
    private final CurrentUserProvider currentUserProvider;
    private final AuditTrailService auditTrailService;

    @Transactional(readOnly = true)
    public List<SystemConfigurationResponse> listConfigurations() {
        return configRepository.findAll().stream()
                .map(this::toSystemConfigurationResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SystemConfigurationResponse updateConfiguration(String key, UpdateConfigRequest request) {
        SystemConfiguration config = configRepository.findByConfigKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Configuration", "key", key));
        String oldValue = config.getConfigValue();
        config.setConfigValue(request.getConfigValue());
        if (request.getConfigType() != null) config.setConfigType(ConfigType.valueOf(request.getConfigType()));
        if (request.getDescription() != null) config.setDescription(request.getDescription());
        config.setUpdatedBy(currentUserProvider.getCurrentUser());
        config = configRepository.save(config);
        auditTrailService.logAction("SYSTEM_CONFIG", config.getId(), key, "UPDATE",
                "config_value", oldValue, request.getConfigValue(), null);
        return toSystemConfigurationResponse(config);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> listOrganizations() {
        return organizationRepository.findByIsActiveTrue().stream()
                .map(this::toOrganizationResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlantSiteResponse> listPlantSites(UUID organizationId) {
        List<PlantSite> sites = organizationId != null
                ? plantSiteRepository.findByOrganizationIdAndIsActiveTrue(organizationId)
                : plantSiteRepository.findByIsActiveTrue();
        return sites.stream().map(this::toPlantSiteResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> listDepartments(UUID plantSiteId) {
        List<Department> departments = plantSiteId != null
                ? departmentRepository.findByPlantSiteIdAndIsActiveTrue(plantSiteId)
                : departmentRepository.findByIsActiveTrue();
        return departments.stream().map(this::toDepartmentResponse).collect(Collectors.toList());
    }

    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {
        Department dept = new Department();
        dept.setPlantSite(plantSiteRepository.findById(request.getPlantSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("PlantSite", "id", request.getPlantSiteId())));
        dept.setName(request.getName());
        dept.setCode(request.getCode());
        dept.setDescription(request.getDescription());
        if (request.getParentDepartmentId() != null)
            dept.setParentDepartment(departmentRepository.findById(request.getParentDepartmentId()).orElse(null));
        return toDepartmentResponse(departmentRepository.save(dept));
    }

    private SystemConfigurationResponse toSystemConfigurationResponse(SystemConfiguration c) {
        return SystemConfigurationResponse.builder()
                .id(c.getId())
                .configKey(c.getConfigKey())
                .configValue(c.getConfigValue())
                .configType(c.getConfigType() != null ? c.getConfigType().name() : null)
                .module(c.getModule())
                .plantSiteId(c.getPlantSite() != null ? c.getPlantSite().getId() : null)
                .plantSiteName(c.getPlantSite() != null ? c.getPlantSite().getName() : null)
                .description(c.getDescription())
                .isEncrypted(c.getIsEncrypted())
                .updatedAt(c.getUpdatedAt())
                .updatedById(c.getUpdatedBy() != null ? c.getUpdatedBy().getId() : null)
                .updatedByName(c.getUpdatedBy() != null ? c.getUpdatedBy().getDisplayName() : null)
                .build();
    }

    private OrganizationResponse toOrganizationResponse(Organization o) {
        return OrganizationResponse.builder()
                .id(o.getId())
                .name(o.getName())
                .code(o.getCode())
                .type(o.getType() != null ? o.getType().name() : null)
                .address(o.getAddress())
                .city(o.getCity())
                .state(o.getState())
                .country(o.getCountry())
                .phone(o.getPhone())
                .email(o.getEmail())
                .gmpCertification(o.getGmpCertification() != null ? o.getGmpCertification().name() : null)
                .licenseNumber(o.getLicenseNumber())
                .isActive(o.getIsActive())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }

    private PlantSiteResponse toPlantSiteResponse(PlantSite p) {
        return PlantSiteResponse.builder()
                .id(p.getId())
                .organizationId(p.getOrganization() != null ? p.getOrganization().getId() : null)
                .organizationName(p.getOrganization() != null ? p.getOrganization().getName() : null)
                .name(p.getName())
                .code(p.getCode())
                .address(p.getAddress())
                .city(p.getCity())
                .state(p.getState())
                .country(p.getCountry())
                .siteType(p.getSiteType() != null ? p.getSiteType().name() : null)
                .fdaRegistration(p.getFdaRegistration())
                .isActive(p.getIsActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private DepartmentResponse toDepartmentResponse(Department d) {
        return DepartmentResponse.builder()
                .id(d.getId())
                .plantSiteId(d.getPlantSite() != null ? d.getPlantSite().getId() : null)
                .plantSiteName(d.getPlantSite() != null ? d.getPlantSite().getName() : null)
                .name(d.getName())
                .code(d.getCode())
                .description(d.getDescription())
                .parentDepartmentId(d.getParentDepartment() != null ? d.getParentDepartment().getId() : null)
                .parentDepartmentName(d.getParentDepartment() != null ? d.getParentDepartment().getName() : null)
                .isActive(d.getIsActive())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
