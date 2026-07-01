package com.qmspharma.repository;

import com.qmspharma.model.entity.ChangeAffectedProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChangeAffectedProductRepository extends JpaRepository<ChangeAffectedProduct, UUID> {
    List<ChangeAffectedProduct> findByChangeRequestId(UUID changeRequestId);
}
