package com.qmspharma.repository;

import com.qmspharma.model.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BatchRepository extends JpaRepository<Batch, UUID> {
    List<Batch> findByProductId(UUID productId);
}
