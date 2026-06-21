package com.qmspharma.service;

import com.qmspharma.exception.ResourceNotFoundException;
import com.qmspharma.model.dto.request.CreateDepartmentRequest;
import com.qmspharma.model.dto.request.UpdateConfigRequest;
import com.qmspharma.model.entity.*;
import com.qmspharma.model.enums.ConfigType;
import com.qmspharma.repository.*;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

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
    public List<SystemConfiguration> listConfigurations() {
        return configRepository.findAll();
    }

    @Transactional
    public SystemConfiguration updateConfiguration(String key, UpdateConfigRequest request) {
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
        return config;
    }

    @Transactional(readOnly = true)
    public List<Organization> listOrganizations() {
        return organizationRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public List<PlantSite> listPlantSites(UUID organizationId) {
        if (organizationId != null) return plantSiteRepository.findByOrganizationIdAndIsActiveTrue(organizationId);
        return plantSiteRepository.findByIsActiveTrue();
    }

    @Transactional(readOnly = true)
    public List<Department> listDepartments(UUID plantSiteId) {
        if (plantSiteId != null) return departmentRepository.findByPlantSiteIdAndIsActiveTrue(plantSiteId);
        return departmentRepository.findByIsActiveTrue();
    }

    @Transactional
    public Department createDepartment(CreateDepartmentRequest request) {
        Department dept = new Department();
        dept.setPlantSite(plantSiteRepository.findById(request.getPlantSiteId())
                .orElseThrow(() -> new ResourceNotFoundException("PlantSite", "id", request.getPlantSiteId())));
        dept.setName(request.getName());
        dept.setCode(request.getCode());
        dept.setDescription(request.getDescription());
        if (request.getParentDepartmentId() != null)
            dept.setParentDepartment(departmentRepository.findById(request.getParentDepartmentId()).orElse(null));
        return departmentRepository.save(dept);
    }
}
