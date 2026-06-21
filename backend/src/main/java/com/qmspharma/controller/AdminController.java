package com.qmspharma.controller;

import com.qmspharma.model.dto.request.CreateDepartmentRequest;
import com.qmspharma.model.dto.request.UpdateConfigRequest;
import com.qmspharma.model.dto.response.DepartmentResponse;
import com.qmspharma.model.dto.response.OrganizationResponse;
import com.qmspharma.model.dto.response.PlantSiteResponse;
import com.qmspharma.model.dto.response.SystemConfigurationResponse;
import com.qmspharma.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/configurations")
    public ResponseEntity<List<SystemConfigurationResponse>> listConfigurations() {
        return ResponseEntity.ok(adminService.listConfigurations());
    }

    @PutMapping("/configurations/{key}")
    public ResponseEntity<SystemConfigurationResponse> updateConfiguration(@PathVariable String key, @Valid @RequestBody UpdateConfigRequest request) {
        return ResponseEntity.ok(adminService.updateConfiguration(key, request));
    }

    @GetMapping("/organizations")
    public ResponseEntity<List<OrganizationResponse>> listOrganizations() {
        return ResponseEntity.ok(adminService.listOrganizations());
    }

    @GetMapping("/plant-sites")
    public ResponseEntity<List<PlantSiteResponse>> listPlantSites(@RequestParam(required = false) UUID organizationId) {
        return ResponseEntity.ok(adminService.listPlantSites(organizationId));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentResponse>> listDepartments(@RequestParam(required = false) UUID plantSiteId) {
        return ResponseEntity.ok(adminService.listDepartments(plantSiteId));
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentResponse> createDepartment(@Valid @RequestBody CreateDepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createDepartment(request));
    }
}
