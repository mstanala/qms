package com.qmspharma.repository;

import com.qmspharma.model.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByIsActiveTrue();
    List<Product> findByPlantSiteIdAndIsActiveTrue(UUID plantSiteId);
}
