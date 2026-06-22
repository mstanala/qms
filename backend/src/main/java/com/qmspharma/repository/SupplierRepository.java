package com.qmspharma.repository;

import com.qmspharma.model.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID>, JpaSpecificationExecutor<Supplier> {
    Optional<Supplier> findBySupplierNumber(String supplierNumber);
    long countByStatus(String status);
    List<Supplier> findByStatus(String status);

    @Query("SELECT s.status, COUNT(s) FROM Supplier s GROUP BY s.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT s.supplierType, COUNT(s) FROM Supplier s GROUP BY s.supplierType")
    List<Object[]> countBySupplierType();

    @Query("SELECT s.category, COUNT(s) FROM Supplier s GROUP BY s.category")
    List<Object[]> countByCategory();

    @Query("SELECT s FROM Supplier s WHERE s.nextRequalificationDate < :threshold")
    List<Supplier> findDueForRequalification(Instant threshold);
}
