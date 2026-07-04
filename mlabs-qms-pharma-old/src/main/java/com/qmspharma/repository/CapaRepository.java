package com.qmspharma.repository;

import com.qmspharma.model.entity.Capa;
import com.qmspharma.model.enums.CapaStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface CapaRepository extends JpaRepository<Capa, UUID>, JpaSpecificationExecutor<Capa> {
    Optional<Capa> findByCapaNumber(String capaNumber);
    long countByStatus(CapaStatus status);

    @Query("SELECT COUNT(c) FROM Capa c WHERE c.status NOT IN ('CLOSED', 'REJECTED') AND c.dueDate < CURRENT_TIMESTAMP")
    long countOverdue();

    @Query("SELECT c.status, COUNT(c) FROM Capa c GROUP BY c.status")
    java.util.List<Object[]> countByStatusGrouped();

    @Query("SELECT c.priority, COUNT(c) FROM Capa c GROUP BY c.priority")
    java.util.List<Object[]> countByPriority();

    @Query("SELECT c.department.name, COUNT(c) FROM Capa c GROUP BY c.department.name")
    java.util.List<Object[]> countByDepartment();
}
