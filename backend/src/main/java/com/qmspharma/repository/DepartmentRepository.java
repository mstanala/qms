package com.qmspharma.repository;

import com.qmspharma.model.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    List<Department> findByPlantSiteIdAndIsActiveTrue(UUID plantSiteId);
    List<Department> findByIsActiveTrue();
}
